<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "../stores/auth";
import { getPermissions } from "../shared/auth/permissions";
import { mockWarehouses } from "../shared/mocks/data";
import EditableTable from "../components/EditableTable.vue";
import type { Warehouse } from "../shared/api/types";

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

function handleUpdate(item: Warehouse, field: keyof Warehouse, newValue: any) {
	const itemIndex = mockWarehouses.findIndex((w) => w.id === item.id);
	if (itemIndex !== -1) {
		(mockWarehouses[itemIndex] as any)[field] = newValue;
	}
	console.log("Сохранено:", { warehouseId: item.id, field, newValue });
}
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Склады</h1>
			<div class="actions">
				<button
					v-if="permissions.canEditNomenclature"
					class="btn btnPrimary"
					type="button"
				>
					Создать склад
				</button>
			</div>
		</div>

		<EditableTable
			:columns="columns"
			:data="mockWarehouses"
			row-key="id"
			:can-edit="permissions.canEditNomenclature"
			@update="handleUpdate"
		>
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
.pageHeader {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: var(--space-4);
}
.btnPrimary {
	padding: 6px 12px;
	background: #646cff;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
}
.btnPrimary:hover {
	background: #535bf2;
}
</style>
