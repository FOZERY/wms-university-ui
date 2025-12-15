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
	{ key: "name" as keyof Warehouse, label: "Название" },
	{
		key: "address" as keyof Warehouse,
		label: "Адрес",
		format: (val: string | undefined) => val || "—",
	},
]);
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
			:can-edit="false"
		/>
	</div>
</template>
