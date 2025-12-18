<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import EditableTable from "../components/EditableTable.vue";
import useDebounce from "../composables/useDebounce";
import type { Item } from "../shared/api/types";
import { getPermissions } from "../shared/auth/permissions";
import { mockItems } from "../shared/mocks/data";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

const isLoading = ref(false);
const error = ref<string | null>(null);
const items = ref<Item[]>([]);

type TypeFilter = "all" | Item["type"];
const typeFilter = ref<TypeFilter>("all");
const searchQuery = ref("");
const debouncedSearch = useDebounce(searchQuery, 250);

function clearSearch() {
	searchQuery.value = "";
	try {
		debouncedSearch.value = "";
	} catch { }
}
function mapItemTypeToRu(type: Item["type"]): string {
	return type === "material" ? "Материал" : "Готовая продукция";
}

const filteredItems = computed(() => {
	if (typeFilter.value === "all") return items.value;
	return items.value.filter((it) => it.type === typeFilter.value);
});

const displayedItems = computed(() => {
	const q = debouncedSearch.value.trim().toLowerCase();
	if (!q) return filteredItems.value;
	return filteredItems.value.filter((it) => {
		return (
			String(it.name).toLowerCase().includes(q) ||
			String(it.code || "")
				.toLowerCase()
				.includes(q)
		);
	});
});

const columns = computed(() => [
	{ key: "id" as keyof Item, label: "ID", width: "60px" },
	{ key: "code" as keyof Item, label: "Код", editable: true },
	{ key: "name" as keyof Item, label: "Название", editable: true },
	{
		key: "type" as keyof Item,
		label: "Тип",
		editable: true,
		type: "select" as const,
		options: [
			{ value: "material", label: "Материал" },
			{ value: "product", label: "Готовая продукция" },
		],
		format: mapItemTypeToRu,
	},
	{ key: "unit" as keyof Item, label: "Ед.", editable: true },
	{ key: "minQuantity" as keyof Item, label: "Мин. остаток", editable: true },
]);

async function load() {
	isLoading.value = true;
	error.value = null;

	try {
		items.value = mockItems;
	} catch {
		error.value = "Не удалось загрузить номенклатуру.";
	} finally {
		isLoading.value = false;
	}
}

function handleUpdate(item: Item, field: keyof Item, newValue: any) {
	const itemIndex = items.value.findIndex((it) => it.id === item.id);
	if (itemIndex !== -1) {
		(items.value[itemIndex] as any)[field] = newValue;
	}
	console.log("Сохранено:", { itemId: item.id, field, newValue });
}

onMounted(load);
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Номенклатура</h1>
			<div class="searchWrap">
				<input v-model="searchQuery" class="searchInput" placeholder="Поиск по названию или коду..." />
				<button v-if="searchQuery" class="clearButton" type="button" @click="clearSearch">×</button>
			</div>
			<div class="actions">
				<label class="muted">
					Тип:&nbsp;
					<select v-model="typeFilter" class="select">
						<option value="all">Все</option>
						<option value="material">Материал</option>
						<option value="product">Готовая продукция</option>
					</select>
				</label>
				<button v-if="permissions.canEditNomenclature" class="btn btnPrimary" type="button">
					Создать позицию
				</button>
				<button class="btn" type="button" @click="load">
					Обновить
				</button>
			</div>
		</div>

		<p v-if="isLoading">Загрузка…</p>
		<p v-else-if="error">{{ error }}</p>

		<EditableTable v-else :columns="columns" :data="displayedItems" row-key="id" :can-edit="true"
			@update="handleUpdate">
			<template #cell-name="{ item }">
				<router-link :to="`/items/${item.id}`" class="link">{{
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

/* page header, actions and buttons use global styles in `src/style.css` */
</style>
