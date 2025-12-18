<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import EditableTable from "../components/EditableTable.vue";
import useDebounce from "../composables/useDebounce";
import type { Supplier } from "../shared/api/types";
import { mockSuppliers } from "../shared/mocks/data";

const isLoading = ref(false);
const error = ref<string | null>(null);
const suppliers = ref<Supplier[]>([]);
const searchQuery = ref("");
const debouncedSearch = useDebounce(searchQuery, 250);

function clearSearch() {
	searchQuery.value = "";
	try {
		debouncedSearch.value = "";
	} catch { }
}

const columns = computed(() => [
	{ key: "id" as keyof Supplier, label: "ID", width: "60px" },
	{ key: "name" as keyof Supplier, label: "Название", editable: true },
	{
		key: "inn" as keyof Supplier,
		label: "ИНН",
		editable: true,
		format: (val: string | undefined) => val || "—",
	},
	{
		key: "phone" as keyof Supplier,
		label: "Телефон",
		editable: true,
		format: (val: string | undefined) => val || "—",
	},
	{
		key: "email" as keyof Supplier,
		label: "Email",
		editable: true,
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

const displayedSuppliers = computed(() => {
	const q = debouncedSearch.value.trim().toLowerCase();
	if (!q) return suppliers.value;
	return suppliers.value.filter((s) => {
		return (
			String(s.name || "")
				.toLowerCase()
				.includes(q) ||
			String(s.inn || "")
				.toLowerCase()
				.includes(q) ||
			String(s.email || "")
				.toLowerCase()
				.includes(q) ||
			String(s.phone || "")
				.toLowerCase()
				.includes(q)
		);
	});
});

// no update handler required for suppliers list at the moment

onMounted(load);
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Поставщики</h1>
			<div class="searchWrap">
				<input v-model="searchQuery" class="searchInput" placeholder="Поиск по названию, ИНН, email или телефону..." />
				<button v-if="searchQuery" class="clearButton" type="button" @click="clearSearch">×</button>
			</div>
			<div class="actions">
				<button class="btn" type="button" @click="load">
					Обновить
				</button>
			</div>
		</div>

		<p v-if="isLoading">Загрузка…</p>
		<p v-else-if="error">{{ error }}</p>

		<EditableTable v-else :columns="columns" :data="displayedSuppliers" row-key="id" :can-edit="false">
			<template #cell-name="{ item }">
				<router-link :to="`/suppliers/${item.id}`" class="link">{{
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
