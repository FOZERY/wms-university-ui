<script setup lang="ts">
import { computed, ref } from "vue";
import EditableTable from "../components/EditableTable.vue";
import useDebounce from "../composables/useDebounce";
import type { Warehouse } from "../shared/api/types";
import { getPermissions } from "../shared/auth/permissions";
import { mockWarehouses } from "../shared/mocks/data";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

const columns = computed(() => [
	{ key: "id" as keyof Warehouse, label: "ID", width: "60px" },
	{ key: "name" as keyof Warehouse, label: "Название", editable: true },
	{
		key: "address" as keyof Warehouse,
		label: "Адрес",
		editable: true,
		format: (val: string | undefined) => val || "—",
	},
]);

function handleUpdate(item: any, field: keyof Warehouse, newValue: any) {
	const itemIndex = mockWarehouses.findIndex((w) => w.id === item.id);
	if (itemIndex !== -1) {
		(mockWarehouses[itemIndex] as any)[field] = newValue;
	}
	console.log("Сохранено:", { warehouseId: item.id, field, newValue });
}
const searchQuery = ref("");
const debouncedSearch = useDebounce(searchQuery, 250);
function clearSearch() {
	searchQuery.value = "";
	try {
		debouncedSearch.value = "";
	} catch { }
}

const displayedWarehouses = computed(() => {
	const q = debouncedSearch.value.trim().toLowerCase();
	if (!q) return mockWarehouses;
	return mockWarehouses.filter((w) => {
		return (
			String(w.name || "")
				.toLowerCase()
				.includes(q) ||
			String(w.address || "")
				.toLowerCase()
				.includes(q)
		);
	});
});
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Склады</h1>
			<div class="searchWrap">
				<input v-model="searchQuery" class="searchInput" placeholder="Поиск по названию..." />
				<button v-if="searchQuery" class="clearButton" type="button" @click="clearSearch">×</button>
			</div>
			<div class="actions">
				<button v-if="permissions.canEditNomenclature" class="btn btnPrimary" type="button">
					Создать склад
				</button>
			</div>
		</div>

		<EditableTable :columns="columns" :data="displayedWarehouses" row-key="id"
			:can-edit="permissions.canEditNomenclature" @update="handleUpdate">
			<template #cell-name="{ item }">
				<router-link :to="`/warehouses/${item.id}`" class="link">{{
					item.name
				}}</router-link>
			</template>
		</EditableTable>
	</div>
</template>

<style scoped>
.link {
	color: #646cff;
	text-decoration: none;
	font-weight: 500;
}

.link:hover {
	text-decoration: underline;
}

/* header/actions/buttons use global styles in `src/style.css` */
</style>
