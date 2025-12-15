<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { Supplier } from "../shared/api/types";
import { mockSuppliers } from "../shared/mocks/data";
import EditableTable from "../components/EditableTable.vue";

const isLoading = ref(false);
const error = ref<string | null>(null);
const suppliers = ref<Supplier[]>([]);

const columns = computed(() => [
	{ key: "id" as keyof Supplier, label: "ID", width: "60px" },
	{ key: "name" as keyof Supplier, label: "Название" },
	{
		key: "inn" as keyof Supplier,
		label: "ИНН",
		format: (val: string | undefined) => val || "—",
	},
	{
		key: "phone" as keyof Supplier,
		label: "Телефон",
		format: (val: string | undefined) => val || "—",
	},
	{
		key: "email" as keyof Supplier,
		label: "Email",
		format: (val: string | undefined) => val || "—",
	},
]);

async function load() {
	isLoading.value = true;
	error.value = null;

	try {
		suppliers.value = mockSuppliers;
	} catch {
		error.value = "Не удалось загрузить поставщиков.";
	} finally {
		isLoading.value = false;
	}
}

onMounted(load);
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Поставщики</h1>
			<div class="actions">
				<button class="btn" type="button" @click="load">
					Обновить
				</button>
			</div>
		</div>

		<p v-if="isLoading">Загрузка…</p>
		<p v-else-if="error">{{ error }}</p>

		<EditableTable
			v-else
			:columns="columns"
			:data="suppliers"
			row-key="id"
			:can-edit="false"
		/>
	</div>
</template>
