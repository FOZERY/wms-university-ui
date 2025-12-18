<script setup lang="ts">
import { computed, ref } from "vue";
import EditableTable from "../components/EditableTable.vue";
import useDebounce from "../composables/useDebounce";
import { getPermissions } from "../shared/auth/permissions";
import { mockStock } from "../shared/mocks/data";
import { useAuthStore } from "../stores/auth";

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
				<button v-if="permissions.canAdjustStock" class="btn btnPrimary" type="button">
					Корректировка
				</button>
			</div>
		</div>

		<EditableTable :columns="columns" :data="displayedStock" row-key="itemId" :can-edit="true" @update="handleUpdate" />
	</div>
</template>

<style scoped>
/* searchInput uses shared style in src/style.css */
</style>
