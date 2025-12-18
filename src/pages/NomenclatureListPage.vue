<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import EditableTable from "../components/EditableTable.vue";
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

function mapItemTypeToRu(type: Item["type"]): string {
	return type === "material" ? "Материал" : "Готовая продукция";
}

const filteredItems = computed(() => {
	if (typeFilter.value === "all") return items.value;
	return items.value.filter((it) => it.type === typeFilter.value);
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
			<div class="actions">
				<label class="muted">
					Тип:&nbsp;
					<select v-model="typeFilter" class="select">
						<option value="all">Все</option>
						<option value="material">Материал</option>
						<option value="product">Готовая продукция</option>
					</select>
				</label>
				<button
					v-if="permissions.canEditNomenclature"
					class="btn btnPrimary"
					type="button"
				>
					Создать позицию
				</button>
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
			:data="filteredItems"
			row-key="id"
			:can-edit="true"
			@update="handleUpdate"
		>
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
.pageHeader {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: var(--space-4);
}
.actions {
	display: flex;
	gap: var(--space-3);
	align-items: center;
}
.select {
	padding: 6px;
	border-radius: 4px;
	border: 1px solid var(--border);
	background: var(--surface);
	color: var(--text);
}
.btn {
	padding: 4px 8px;
	border: 1px solid var(--border);
	background: var(--surface);
	border-radius: 4px;
	cursor: pointer;
	color: var(--text);
}
.btn:hover {
	background: var(--surface-2);
}
.btnPrimary {
	background: #646cff;
	color: white;
	border: none;
}
.btnPrimary:hover {
	background: #535bf2;
}
</style>
