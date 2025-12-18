<script setup lang="ts">
import { computed, ref } from "vue";
import EditableTable from "../components/EditableTable.vue";
import useDebounce from "../composables/useDebounce";
import { getPermissions } from "../shared/auth/permissions";
import { mockStock, mockWarehouses, mockItems, mockAdjustments } from "../shared/mocks/data";
import { useAuthStore } from "../stores/auth";
import ModalForm from "../components/ModalForm.vue";
import FormField from "../components/FormField.vue";

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

type WarehouseFilter = "all" | "materials" | "products";
const warehouseFilter = ref<WarehouseFilter>("all");
const searchQuery = ref("");
const debouncedSearch = useDebounce(searchQuery, 250);

function clearSearch() {
	searchQuery.value = "";
	try {
		debouncedSearch.value = "";
	} catch { }
}

interface StockRow {
	warehouseId: number;
	warehouseName: string;
	itemId: number;
	itemName: string;
	quantity: string;
	reserved: string;
	available: string;
}

function mapWarehouseToRu(warehouseName: string): string {
	// Простая маппинга под текущие моки.
	return warehouseName.includes("Готов")
		? "Склад готовой продукции"
		: "Склад материалов";
}

const filteredStock = computed(() => {
	if (warehouseFilter.value === "all") return mockStock;
	if (warehouseFilter.value === "products") {
		return mockStock.filter((r) => r.warehouseName.includes("Готов"));
	}
	return mockStock.filter((r) => !r.warehouseName.includes("Готов"));
});

const displayedStock = computed(() => {
	const q = debouncedSearch.value.trim().toLowerCase();
	if (!q) return filteredStock.value;
	return filteredStock.value.filter((r) => {
		return (
			String(r.itemName || "")
				.toLowerCase()
				.includes(q) ||
			String(r.warehouseName || "")
				.toLowerCase()
				.includes(q)
		);
	});
});

const columns = computed(() => [
	{
		key: "warehouseName" as keyof StockRow,
		label: "Склад",
		editable: true,
		format: mapWarehouseToRu,
	},
	{ key: "itemName" as keyof StockRow, label: "Товар", editable: true },
	{ key: "quantity" as keyof StockRow, label: "Кол-во", editable: true },
	{ key: "reserved" as keyof StockRow, label: "Резерв", editable: true },
	{ key: "available" as keyof StockRow, label: "Доступно", editable: true },
]);

function handleUpdate(item: StockRow, field: keyof StockRow, newValue: any) {
	const itemIndex = mockStock.findIndex(
		(s) => s.warehouseId === item.warehouseId && s.itemId === item.itemId
	);
	if (itemIndex !== -1) {
		(mockStock[itemIndex] as any)[field] = newValue;
	}
	console.log("Сохранено:", {
		warehouseId: item.warehouseId,
		itemId: item.itemId,
		field,
		newValue,
	});
}

// Adjust modal state
const showAdjust = ref(false);
const adjusting = ref(false);

const adjustModel = ref<{
	warehouseId: number | null;
	itemId: number | null;
	type: "increase" | "decrease";
	quantity: string;
	reason: string;
	reference?: string | null;
}>({ warehouseId: null, itemId: null, type: "increase", quantity: "", reason: "", reference: null });

function openAdjust() {
	// prefill warehouse if filter narrows to single warehouse
	const first = filteredStock.value[0];
	adjustModel.value.warehouseId = first ? first.warehouseId : (mockWarehouses[0]?.id ?? null);
	adjustModel.value.itemId = first ? first.itemId : (mockItems[0]?.id ?? null);
	adjustModel.value.type = "increase";
	adjustModel.value.quantity = "";
	adjustModel.value.reason = "";
	adjustModel.value.reference = null;
	showAdjust.value = true;
}

function closeAdjust() {
	showAdjust.value = false;
}

async function submitAdjust() {
	adjusting.value = true;
	try {
		const wid = adjustModel.value.warehouseId;
		const iid = adjustModel.value.itemId;
		const qty = Number(adjustModel.value.quantity);
		const reason = (adjustModel.value.reason || "").trim();
		if (!wid || !iid) throw new Error("Выберите склад и товар.");
		if (!reason) throw new Error("Причина обязательна.");
		if (!qty || Number.isNaN(qty) || qty <= 0) throw new Error("Количество должно быть положительным числом.");

		const idx = mockStock.findIndex((s) => s.warehouseId === wid && s.itemId === iid);
		if (idx === -1) throw new Error("Позиция не найдена в остатках.");

		const row = mockStock[idx];
		if (!row) throw new Error("Позиция не найдена (внутренняя ошибка).");
		const currentQuantity = Number(row.quantity) || 0;
		const reserved = Number(row.reserved) || 0;
		const available = currentQuantity - reserved;
		const delta = adjustModel.value.type === "increase" ? qty : -qty;

		if (delta < 0 && Math.abs(delta) > available) {
			throw new Error("Недостаточно доступного количества для уменьшения.");
		}

		const newQuantity = currentQuantity + delta;
		row.quantity = newQuantity.toFixed(3);
		row.available = String((newQuantity - reserved).toFixed(3));

		// record adjustment
		const maxId = mockAdjustments.reduce((m, a) => Math.max(m, a.id), 0);
		mockAdjustments.unshift({
			id: maxId + 1,
			userId: (await auth.ensureMeLoaded(), auth.me?.id ?? null),
			warehouseId: wid,
			itemId: iid,
			delta,
			reason,
			referenceDocument: adjustModel.value.reference || null,
			createdAt: Date.now(),
		});

		showAdjust.value = false;
		alert("Корректировка применена");
	} catch (e: any) {
		alert(e?.message || "Ошибка корректировки");
	} finally {
		adjusting.value = false;
	}
}
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Остатки</h1>
			<div class="searchWrap">
				<input v-model="searchQuery" class="searchInput" placeholder="Поиск по товару или складу..." />
				<button v-if="searchQuery" class="clearButton" type="button" @click="clearSearch">×</button>
			</div>
			<div class="actions">
				<label class="muted">
					Склад:&nbsp;
					<select v-model="warehouseFilter" class="select">
						<option value="all">Все</option>
						<option value="materials">Склад материалов</option>
						<option value="products">
							Склад готовой продукции
						</option>
					</select>
				</label>
				<button v-if="permissions.canAdjustStock" class="btn btnPrimary" type="button" @click="openAdjust">
					Корректировка
				</button>
			</div>
		</div>

		<EditableTable :columns="columns" :data="displayedStock" row-key="itemId" :can-edit="true" @update="handleUpdate" />

		<ModalForm v-model="showAdjust" title="Корректировка остатка">
			<div>
				<FormField label="Склад" type="select" :options="mockWarehouses.map(w => ({ value: w.id, label: w.name }))"
					v-model="adjustModel.warehouseId" />
				<FormField label="Товар" type="select" :options="mockItems.map(i => ({ value: i.id, label: i.name }))"
					v-model="adjustModel.itemId" />
				<div style="display:flex;gap:8px;align-items:center">
					<label style="display:flex;gap:8px;align-items:center"><input type="radio" value="increase"
							v-model="adjustModel.type" /> Увеличить</label>
					<label style="display:flex;gap:8px;align-items:center"><input type="radio" value="decrease"
							v-model="adjustModel.type" /> Уменьшить</label>
				</div>
				<FormField label="Количество" v-model="adjustModel.quantity" placeholder="0.000" />
				<FormField label="Причина" v-model="adjustModel.reason" placeholder="Короткое описание причины" />
				<FormField label="Ссылка на документ (опционально)" v-model="adjustModel.reference" placeholder="ПР-0001" />
			</div>

			<template #footer>
				<button class="btn" type="button" @click="closeAdjust">Отмена</button>
				<button class="btn btnPrimary" type="button" @click="submitAdjust" :disabled="adjusting">{{ adjusting ?
					'Сохраняю...' : 'Применить' }}</button>
			</template>
		</ModalForm>
	</div>
</template>

<style scoped>
/* searchInput uses shared style in src/style.css */
</style>
