<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import EditableTable from "../components/EditableTable.vue";
import useDebounce from "../composables/useDebounce";
import type { Item } from "../shared/api/types";
import { getPermissions } from "../shared/auth/permissions";
import { mockItems } from "../shared/mocks/data";
import { useAuthStore } from "../stores/auth";
import ModalForm from "../components/ModalForm.vue";
import FormField from "../components/FormField.vue";

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

const isLoading = ref(false);
const error = ref<string | null>(null);
const items = ref<Item[]>([]);

const showCreate = ref(false);
const isEditing = ref(false);
const creating = ref(false);
const formError = ref<string | null>(null);
const formModel = ref<Partial<Item>>({
	code: "",
	name: "",
	type: "material",
	unit: "",
	minQuantity: "0",
	description: null,
});
const editingId = ref<number | null>(null);

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
		// keep forms frontend-first for now — use mock data source
		items.value = mockItems;
	} catch (e) {
		error.value = "Не удалось загрузить номенклатуру.";
	} finally {
		isLoading.value = false;
	}
}

function handleUpdate(item: Item, field: keyof Item, newValue: any) {
	const itemIndex = items.value.findIndex((it) => it.id === item.id);
	if (itemIndex === -1) return;

	// Frontend-only update for now (no API calls per request)
	if (itemIndex !== -1) {
		(items.value[itemIndex] as any)[field] = newValue;
		if (items.value[itemIndex]) items.value[itemIndex].updatedAt = Date.now();
	}
	console.log("Локально сохранено:", { itemId: item.id, field, newValue });
}


function openCreate() {
	formError.value = null;
	isEditing.value = false;
	editingId.value = null;
	formModel.value = {
		code: "",
		name: "",
		type: "material",
		unit: "",
		minQuantity: "0",
		description: null,
	};
	showCreate.value = true;
}

// edit via modal on detail page; inline openEditItem removed

function closeCreate() {
	showCreate.value = false;
	isEditing.value = false;
	editingId.value = null;
}

async function submitCreate() {
	formError.value = null;
	creating.value = true;
	try {
		// minimal validation
		if (!formModel.value.name || !formModel.value.code) {
			formError.value = "Код и название обязательны.";
			return;
		}

		if (isEditing.value && editingId.value != null) {
			// apply edit locally
			const idx = items.value.findIndex((it) => it.id === editingId.value);
			if (idx !== -1) {
				const now = Date.now();
				items.value[idx] = {
					...items.value[idx],
					code: String(formModel.value.code),
					name: String(formModel.value.name),
					type: (formModel.value.type as Item['type']) || 'material',
					unit: String(formModel.value.unit || 'шт'),
					minQuantity: String(formModel.value.minQuantity || '0'),
					description: formModel.value.description || null,
					updatedAt: now,
				} as Item;
			}
			showCreate.value = false;
			isEditing.value = false;
			editingId.value = null;
			return;
		}

		// create locally (frontend-only) — assign temporary id
		const maxId = items.value.reduce((m, it) => Math.max(m, it.id), 0);
		const now = Date.now();
		const created: Item = {
			id: maxId + 1,
			code: String(formModel.value.code),
			name: String(formModel.value.name),
			type: (formModel.value.type as Item['type']) || 'material',
			unit: String(formModel.value.unit || 'шт'),
			purchasePrice: null,
			sellPrice: null,
			minQuantity: String(formModel.value.minQuantity || '0'),
			description: formModel.value.description || null,
			createdAt: now,
			updatedAt: now,
		};

		items.value.unshift(created);
		showCreate.value = false;
	} catch (e: any) {
		formError.value = e?.message || "Не удалось создать позицию.";
	} finally {
		creating.value = false;
	}
}

onMounted(load);
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Номенклатура</h1>
			<div class="searchWrap">
				<input v-model="searchQuery" class="searchInput" placeholder="Поиск по коду или названию..." />
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
				<button v-if="permissions.canEditNomenclature" class="btn btnPrimary" type="button" @click="openCreate">
					Создать позицию
				</button>
				<button class="btn" type="button" @click="load">
					Обновить
				</button>
			</div>
		</div>

		<p v-if="isLoading">Загрузка…</p>
		<p v-else-if="error">{{ error }}</p>

		<EditableTable v-else :columns="columns" :data="displayedItems" row-key="id"
			:rowLink="(item) => `/items/${item.id}`" @update="handleUpdate">
			<template #cell-name="{ item }">
				{{ item.name }}
			</template>
		</EditableTable>

		<ModalForm v-model="showCreate" title="Создать позицию">
			<div>
				<FormField label="Код" v-model="formModel.code" placeholder="внутренний код" />
				<FormField label="Название" v-model="formModel.name" placeholder="наименование" />
				<FormField label="Тип" type="select"
					:options="[{ value: 'material', label: 'Материал' }, { value: 'product', label: 'Готовая продукция' }]"
					v-model="formModel.type" />
				<FormField label="Единица" v-model="formModel.unit" placeholder="шт, кг" />
				<FormField label="Мин. остаток" v-model="formModel.minQuantity" placeholder="0" />
				<FormField label="Описание" type="textarea" v-model="formModel.description" placeholder="необязательно" />
				<div v-if="formError" style="color:#f06e6e;margin-top:8px">{{ formError }}</div>
			</div>

			<template #footer>
				<button class="btn" type="button" @click="closeCreate">Отмена</button>
				<button class="btn btnPrimary" type="button" @click="submitCreate" :disabled="creating">{{ creating ?
					'Сохраняю...' : 'Создать' }}</button>
			</template>
		</ModalForm>
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
