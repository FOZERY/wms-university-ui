<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import EditableTable from "../components/EditableTable.vue";
import useDebounce from "../composables/useDebounce";
import { getPermissions } from "../shared/auth/permissions";
import { mockItems, mockAdjustments } from "../shared/mocks/data";
import { warehousesApi } from "../shared/api/warehouses";
import { stockApi } from "../shared/api/stock";
import type { StockBalance } from "../shared/api/types";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import ModalForm from "../components/ModalForm.vue";
import FormField from "../components/FormField.vue";

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

type WarehouseFilter = string | number; // 'all' or warehouseId or legacy material/product
const warehouseFilter = ref<WarehouseFilter>("all");
const warehouses = ref<Array<{ id: number; name: string }>>([]);
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
	// Robust mapping: detect words starting with 'готов' (case-insensitive)
	if (!warehouseName) return "Склад";
	try {
		if (/готов/i.test(warehouseName)) return "Склад готовой продукции";
	} catch { }
	return "Склад материалов";
}

const router = useRouter();

function goToWarehouse(id: number | null) {
	if (!id) return;
	router.push(`/warehouses/${id}`);
}

function goToItem(id: number | null) {
	if (!id) return;
	router.push(`/nomenclature/${id}`);
}

function getWarehouseName(id: number | null) {
	if (!id) return null;
	const w = warehouses.value.find((x) => x.id === id);
	return w ? w.name : null;
}

const stock = ref<StockBalance[]>([]);

const filteredStock = computed(() => {
	if (!Array.isArray(stock.value)) return [];
	if (warehouseFilter.value === "all") return stock.value;

	// numeric or string id -> filter by warehouse id
	if (typeof warehouseFilter.value === 'number' || (typeof warehouseFilter.value === 'string' && /^\\d+\b$/.test(String(warehouseFilter.value)))) {
		const id = Number(warehouseFilter.value);
		return stock.value.filter((r: any) => Number(r.warehouseId) === id);
	}

	if (warehouseFilter.value === "products") {
		return stock.value.filter((r: any) => (r.warehouseName || "").includes("Готов"));
	}

	return stock.value.filter((r: any) => !(r.warehouseName || "").includes("Готов"));
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

const loading = ref(false);
const offset = ref(0);
const limit = ref(30);

async function loadStock() {
	loading.value = true;
	try {
		const params: any = { offset: offset.value };
		// include limit only if set; enforce maximum 100 to avoid huge queries
		if (typeof limit.value === 'number' && !Number.isNaN(limit.value)) {
			params.limit = Math.min(100, Math.max(0, Number(limit.value)));
		}
		const q = debouncedSearch.value.trim();
		if (q) params.search = q;
		// if warehouseFilter is a numeric id, filter by warehouse
		if (warehouseFilter.value !== 'all' && typeof warehouseFilter.value !== 'string') {
			params.warehouseId = warehouseFilter.value;
		}

		// maintain legacy materials/products filters (if used)
		if (warehouseFilter.value === 'materials') params.itemType = 'material';
		if (warehouseFilter.value === 'products') params.itemType = 'product';

		const resp = await stockApi.getAll(params);
		const data = (resp && (resp as any).data) || resp || [];
		const list = Array.isArray(data) ? data : [];
		// ensure each row has a unique key for Vue lists (warehouseId-itemId)
		stock.value = list.map((s: any) => ({ ...s, compositeKey: `${s.warehouseId}-${s.itemId}` }));
	} catch (e) {
		console.error('Failed to load stock', e);
		stock.value = [];
	} finally {
		loading.value = false;
	}
}

onMounted(async () => {
	try {
		// request a reasonable page size to avoid huge responses
		const list = await warehousesApi.list({ limit: 100 });
		warehouses.value = Array.isArray(list) ? list : [];
	} catch (err) {
		console.error('Failed to load warehouses', err);
		warehouses.value = [];
	}
	await loadStock();
});

watch([debouncedSearch, warehouseFilter], () => {
	offset.value = 0;
	loadStock();
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
	const itemIndex = stock.value.findIndex(
		(s: any) => s.warehouseId === item.warehouseId && s.itemId === item.itemId
	);
	if (itemIndex !== -1) {
		(stock.value[itemIndex] as any)[field] = newValue;
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
	adjustModel.value.warehouseId = first ? first.warehouseId : (warehouses[0]?.id ?? null);
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

		const idx = stock.value.findIndex((s: any) => s.warehouseId === wid && s.itemId === iid);
		if (idx === -1) throw new Error("Позиция не найдена в остатках.");

		const row = stock.value[idx] as any;
		if (!row) throw new Error("Позиция не найдена (внутренняя ошибка).");
		const currentQuantity = Number(row.quantity) || 0;
		const reserved = Number(row.reserved) || 0;
		const available = currentQuantity - reserved;
		const delta = adjustModel.value.type === "increase" ? qty : -qty;

		if (delta < 0 && Math.abs(delta) > available) {
			throw new Error("Недостаточно доступного количества для уменьшения.");
		}

		const newQuantity = currentQuantity + delta;

		if (adjustModel.value.type === "increase") {
			// call backend adjust
			try {
				await stockApi.adjust({ warehouseId: wid, itemId: iid, quantity: String(qty), type: adjustModel.value.type, reason, reference: adjustModel.value.reference || null });
				// update local row
				row.quantity = newQuantity.toFixed(3);
				row.available = String((newQuantity - reserved).toFixed(3));

				// record adjustment locally for history view (retain mockAdjustments)
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
			} catch (err) {
				throw err;
			}
		} else {
			// decrease: call backend adjust as well
			try {
				await stockApi.adjust({ warehouseId: wid, itemId: iid, quantity: String(qty), type: adjustModel.value.type, reason, reference: adjustModel.value.reference || null });
				row.quantity = newQuantity.toFixed(3);
				row.available = String((newQuantity - reserved).toFixed(3));

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
			} catch (err) {
				throw err;
			}
		}
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
						<option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
					</select>
				</label>
				<button v-if="permissions.canAdjustStock" class="btn btnPrimary" type="button" @click="openAdjust">
					Корректировка
				</button>
			</div>
		</div>

		<EditableTable :columns="columns" :data="displayedStock" row-key="compositeKey" :can-edit="true"
			@update="handleUpdate">
			<template #cell-warehouseName="{ item, value }">
				<a href="#" class="linkCell" @click.prevent.stop="goToWarehouse(item.warehouseId)">
					{{ getWarehouseName(item.warehouseId) || value || mapWarehouseToRu(item.warehouseName || '') }}
				</a>
			</template>

			<template #cell-itemName="{ item, value }">
				<a href="#" class="linkCell" @click.prevent.stop="goToItem(item.itemId)">{{ value || '—' }}</a>
			</template>
		</EditableTable>

		<ModalForm v-model="showAdjust" title="Корректировка остатка">
			<div>
				<FormField label="Склад" type="select" :options="warehouses.map(w => ({ value: w.id, label: w.name }))"
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
.linkCell {
	color: var(--accent);
	text-decoration: none;
}

.linkCell:hover {
	text-decoration: underline;
}
</style>
