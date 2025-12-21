<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import EditableTable from "../components/EditableTable.vue";
import useDebounce from "../composables/useDebounce";
import type { Item } from "../shared/api/types";
import { nomenclatureApi, NomenclatureListQuery } from "../shared/api/nomenclature";
import { getPermissions } from "../shared/auth/permissions";
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

const sortRules = ref<Array<{ field: keyof Item; direction: "asc" | "desc" }>>([]);

function clearSearch() {
	searchQuery.value = "";
	try {
		debouncedSearch.value = "";
	} catch { }
}
import { mapItemTypeToRu } from "../shared/utils/format";

// when using server-side list, displayed items are whatever server returns
const displayedItems = computed(() => items.value);

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
		const query: NomenclatureListQuery = {
			// reasonable page size for list view
			limit: 50,
			offset: 0,
		};

		const q = debouncedSearch.value.trim();
		if (q) query.search = q;

		if (typeFilter.value !== "all") query.type = typeFilter.value as Item['type'];

		if (sortRules.value.length > 0) {
			// build full sort object from all active rules (multi-column sort)
			const sortObj: Record<string, "asc" | "desc"> = {};
			for (const r of sortRules.value) {
				sortObj[String(r.field)] = r.direction;
			}
			// @ts-ignore allow dynamic sort object
			(query as any).sort = sortObj;
		}

		items.value = await nomenclatureApi.list(query);
	} catch (e) {
		console.error(e);
		error.value = "Не удалось загрузить номенклатуру.";
	} finally {
		isLoading.value = false;
	}
}

function onTableSort(rules: Array<{ field: keyof Item; direction: "asc" | "desc" }>) {
	// debug: log incoming sort rules
	try { console.log('NomenclatureListPage.onTableSort', JSON.parse(JSON.stringify(rules))); } catch {}
	sortRules.value = rules;
	load();
}

async function handleUpdate(item: Item, field: keyof Item, newValue: any) {
	if (field === 'id') return;
	try {
		const payload: any = { [String(field)]: newValue };
		await nomenclatureApi.patch(item.id, payload);
		await load();
	} catch (e: any) {
		alert(e?.response?.data?.message || e?.message || 'Не удалось сохранить');
	}
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
			// send PATCH to backend
			try {
				const payload: any = {
					code: String(formModel.value.code),
					name: String(formModel.value.name),
					type: (formModel.value.type as Item['type']) || 'material',
					unit: String(formModel.value.unit || 'шт'),
					minQuantity: String(formModel.value.minQuantity || '0'),
					description: formModel.value.description || null,
				};
				await nomenclatureApi.patch(editingId.value, payload);
				await load();
				showCreate.value = false;
				isEditing.value = false;
				editingId.value = null;
				return;
			} catch (e: any) {
				formError.value = e?.response?.data?.message || e?.message || 'Не удалось сохранить изменения.';
				return;
			}
		}

		// create on backend
		try {
			const payload: any = {
				code: String(formModel.value.code),
				name: String(formModel.value.name),
				type: (formModel.value.type as Item['type']) || 'material',
				unit: String(formModel.value.unit || 'шт'),
				minQuantity: String(formModel.value.minQuantity || '0'),
				description: formModel.value.description || null,
			};
			const res = await nomenclatureApi.create(payload);
			// reload list to show created item (server will return assigned id)
			await load();
			showCreate.value = false;
		} catch (e: any) {
			formError.value = e?.response?.data?.message || e?.message || 'Не удалось создать позицию.';
			return;
		}
	} catch (e: any) {
		formError.value = e?.message || "Не удалось создать позицию.";
	} finally {
		creating.value = false;
	}
}

onMounted(load);

// reload when search/type changes
watch(debouncedSearch, () => load());
watch(typeFilter, () => load());
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
			:rowLink="(item) => `/items/${item.id}`" :can-edit="permissions.canEditNomenclature" :sort="sortRules" @sort="onTableSort" @update="handleUpdate">
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
