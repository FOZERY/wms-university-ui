<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import EditableTable from "../components/EditableTable.vue";
import useDebounce from "../composables/useDebounce";
import type { Supplier } from "../shared/api/types";
import { mockSuppliers } from "../shared/mocks/data";
import ModalForm from "../components/ModalForm.vue";
import FormField from "../components/FormField.vue";
import { useAuthStore } from "../stores/auth";
import { getPermissions } from "../shared/auth/permissions";

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

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

const showCreate = ref(false);
const creating = ref(false);
const createModel = ref<Partial<Supplier>>({ name: "", inn: "", contactPerson: "", phone: "", email: "", address: "" });

function openCreate() {
	createModel.value = { name: "", inn: "", contactPerson: "", phone: "", email: "", address: "" };
	showCreate.value = true;
}

async function submitCreate() {
	creating.value = true;
	try {
		if (!createModel.value.name) throw new Error("Название обязательно");
		const maxId = mockSuppliers.reduce((m, s) => Math.max(m, s.id), 0);
		const now = Date.now();
		const created: Supplier = {
			id: maxId + 1,
			name: String(createModel.value.name),
			inn: createModel.value.inn || null,
			contactPerson: createModel.value.contactPerson || null,
			phone: createModel.value.phone || null,
			email: createModel.value.email || null,
			address: createModel.value.address || null,
			createdAt: now,
			updatedAt: now,
		};
		mockSuppliers.unshift(created);
		suppliers.value = mockSuppliers;
		showCreate.value = false;
	} catch (e: any) {
		alert(e?.message || "Не удалось создать поставщика");
	} finally {
		creating.value = false;
	}
}
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Поставщики</h1>
			<div class="searchWrap">
				<input v-model="searchQuery" class="searchInput" placeholder="Поиск по названию, ИНН..." />
				<button v-if="searchQuery" class="clearButton" type="button" @click="clearSearch">×</button>
			</div>
			<div class="actions">
				<button class="btn" type="button" @click="load">
					Обновить
				</button>
				<button v-if="permissions.canEditNomenclature" class="btn btnPrimary" type="button" @click="openCreate">
					Создать поставщика
				</button>
			</div>
		</div>

		<p v-if="isLoading">Загрузка…</p>
		<p v-else-if="error">{{ error }}</p>

		<EditableTable v-else :columns="columns" :data="displayedSuppliers" row-key="id" :can-edit="false"
			:rowLink="(item) => `/suppliers/${item.id}`">
			<template #cell-name="{ item }">
				<span>{{ item.name }}</span>
			</template>
		</EditableTable>

		<ModalForm v-model="showCreate" title="Создать поставщика">
			<div>
				<FormField label="Название" v-model="createModel.name" placeholder="ООО Ромашка" />
				<FormField label="ИНН" v-model="createModel.inn" placeholder="7700000000" />
				<FormField label="Контактное лицо" v-model="createModel.contactPerson" placeholder="ФИО" />
				<FormField label="Телефон" v-model="createModel.phone" placeholder="+7 (900) 000-00-00" />
				<FormField label="Email" v-model="createModel.email" placeholder="contact@company.test" />
				<FormField label="Адрес" type="textarea" v-model="createModel.address" placeholder="город, улица, дом" />
			</div>

			<template #footer>
				<button class="btn" type="button" @click="showCreate = false">Отмена</button>
				<button class="btn btnPrimary" type="button" @click="submitCreate" :disabled="creating">{{ creating ?
					'Создаю...' : 'Создать' }}</button>
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

/* header/actions/buttons use global styles in `src/style.css` */
</style>
