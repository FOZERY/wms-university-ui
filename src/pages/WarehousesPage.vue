<script setup lang="ts">
import { computed, ref } from "vue";
import EditableTable from "../components/EditableTable.vue";
import useDebounce from "../composables/useDebounce";
import type { Warehouse } from "../shared/api/types";
import { getPermissions } from "../shared/auth/permissions";
import { mockWarehouses } from "../shared/mocks/data";
import { useAuthStore } from "../stores/auth";
import ModalForm from "../components/ModalForm.vue";
import FormField from "../components/FormField.vue";

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
	{ key: "capacity" as keyof Warehouse, label: "Вместимость", width: "120px", editable: true, format: (v: any) => (v == null ? '—' : String(v)) },
]);

function handleUpdate(item: any, field: keyof Warehouse, newValue: any) {
	const itemIndex = mockWarehouses.findIndex((w) => w.id === item.id);
	if (itemIndex !== -1) {
		(mockWarehouses[itemIndex] as any)[field] = newValue;
	}
	console.log("Сохранено:", { warehouseId: item.id, field, newValue });
}
const showCreate = ref(false);
const creating = ref(false);
const createModel = ref<Partial<Warehouse>>({ name: "", address: "", capacity: undefined });

function openCreate() {
	createModel.value = { name: "", address: "", capacity: undefined };
	showCreate.value = true;
}

async function submitCreate() {
	creating.value = true;
	try {
		if (!createModel.value.name) throw new Error("Название обязательно");
		const maxId = mockWarehouses.reduce((m, w) => Math.max(m, w.id), 0);
		const newW: Warehouse = {
			id: maxId + 1,
			name: String(createModel.value.name),
			address: createModel.value.address || null,
			capacity: createModel.value.capacity != null ? Number(createModel.value.capacity) : undefined,
		};
		mockWarehouses.unshift(newW);
		showCreate.value = false;
	} catch (e: any) {
		alert(e?.message || "Не удалось создать склад");
	} finally {
		creating.value = false;
	}
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
				<button v-if="permissions.canEditNomenclature" class="btn btnPrimary" type="button" @click="openCreate">
					Создать склад
				</button>
			</div>
		</div>

		<EditableTable :columns="columns" :data="displayedWarehouses" row-key="id"
			:can-edit="permissions.canEditNomenclature" @update="handleUpdate" :rowLink="(item) => `/warehouses/${item.id}`">
			<template #cell-name="{ item }">
				<span>{{ item.name }}</span>
			</template>
		</EditableTable>

		<ModalForm v-model="showCreate" title="Создать склад">
			<div>
				<FormField label="Название" v-model="createModel.name" placeholder="Название склада" />
				<FormField label="Адрес" v-model="createModel.address" placeholder="улица, дом" />
				<FormField label="Вместимость" v-model="createModel.capacity" placeholder="число (например, 500)" />
			</div>

			<template #footer>
				<button class="btn" type="button" @click="showCreate = false">Отмена</button>
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

/* header/actions/buttons use global styles in `src/style.css` */
</style>
