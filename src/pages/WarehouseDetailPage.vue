<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import ModalForm from "../components/ModalForm.vue";
import FormField from "../components/FormField.vue";
import { useAuthStore } from "../stores/auth";
import { getPermissions } from "../shared/auth/permissions";
import { mockWarehouses } from "../shared/mocks/data";

const route = useRoute();
const router = useRouter();
const warehouseId = route.params.id as string;

const warehouse = ref<any>(null);
const loading = ref(true);
const showEdit = ref(false);
const saving = ref(false);
const formModel = ref<any>({});
const showDelete = ref(false);

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

onMounted(async () => {
	// Mock data assigned synchronously (no artificial delay)
	warehouse.value = {
		id: warehouseId,
		name: "Основной склад",
		address: "ул. Ленина, 1",
		stats: {
			totalItems: 150,
			totalValue: 1500000,
			capacity: 80,
		},
		stock: [
			{
				id: 1,
				name: "Гвозди",
				quantity: 500,
				reserved: 50,
				available: 450,
				unit: "кг",
			},
			{
				id: 2,
				name: "Доски",
				quantity: 100,
				reserved: 0,
				available: 100,
				unit: "шт",
			},
		],
		recentDocuments: [
			{
				id: 1,
				number: "ПР-0001",
				type: "incoming",
				date: "2025-12-13",
				status: "completed",
			},
			{
				id: 2,
				number: "РМ-0005",
				type: "transfer",
				date: "2025-12-10",
				status: "completed",
			},
		],
	};
	loading.value = false;
});

const goBack = () => router.back();

function openEdit() {
	formModel.value = {
		name: warehouse.value.name,
		address: warehouse.value.address,
		capacity: warehouse.value.capacity ?? null,
	};
	showEdit.value = true;
}

function confirmDeleteWarehouse() {
	showDelete.value = true;
}

function performDeleteWarehouse() {
	if (!warehouse.value) return;
	const wid = Number(warehouse.value.id);
	const idx = mockWarehouses.findIndex((w) => String(w.id) === String(warehouse.value.id) || w.id === wid);
	if (idx !== -1) mockWarehouses.splice(idx, 1);
	showDelete.value = false;
	router.back();
}

async function submitEdit() {
	saving.value = true;
	try {
		if (!formModel.value.name) throw new Error('Название обязательно');
		warehouse.value = {
			...warehouse.value,
			name: String(formModel.value.name),
			address: String(formModel.value.address || ''),
			capacity: formModel.value.capacity != null ? Number(formModel.value.capacity) : undefined,
		};
		showEdit.value = false;
	} catch (e: any) {
		alert(e?.message || 'Не удалось сохранить');
	} finally {
		saving.value = false;
	}
}
</script>

<template>
	<div>
		<div class="pageHeader">
			<div class="headerLeft">
				<button @click="goBack" class="backBtn">← Назад</button>
				<h1>{{ warehouse?.name || "Склад" }}</h1>
			</div>
			<div class="actions">
				<button v-if="permissions.canEditNomenclature" class="btn" type="button"
					@click="openEdit">Редактировать</button>
				<button v-if="permissions.canEditNomenclature" class="btn" type="button"
					style="margin-left:8px;background:#ff6b6b;color:white" @click="confirmDeleteWarehouse">Удалить</button>
			</div>
		</div>

		<ModalForm v-model="showEdit" title="Редактировать склад">
			<div>
				<FormField label="Название" v-model="formModel.name" placeholder="Название склада" />
				<FormField label="Адрес" type="textarea" v-model="formModel.address" placeholder="улица, дом" />
				<FormField label="Вместимость" v-model="formModel.capacity" placeholder="число (например, 500)" />
			</div>

			<template #footer>
				<button class="btn" type="button" @click="showEdit = false">Отмена</button>
				<button class="btn btnPrimary" type="button" @click="submitEdit" :disabled="saving">{{ saving ? 'Сохраняю...' :
					'Сохранить' }}</button>
			</template>
		</ModalForm>

		<div v-if="loading" class="loading">Загрузка...</div>

		<div v-else-if="warehouse" class="content">
			<div class="statsGrid">
				<div class="statCard">
					<div class="statLabel">Всего позиций</div>
					<div class="statValue">
						{{ warehouse.stats.totalItems }}
					</div>
				</div>
				<div class="statCard">
					<div class="statLabel">Общая стоимость</div>
					<div class="statValue">
						{{ warehouse.stats.totalValue.toLocaleString() }} ₽
					</div>
				</div>
				<div class="statCard">
					<div class="statLabel">Загруженность</div>
					<div class="statValue">{{ warehouse.stats.capacity }}%</div>
				</div>
			</div>

			<div class="grid2col">
				<div class="card">
					<h3>Остатки на складе</h3>
					<table class="table">
						<thead>
							<tr>
								<th>Номенклатура</th>
								<th>Всего</th>
								<th>Резерв</th>
								<th>Доступно</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="item in warehouse.stock" :key="item.id">
								<td>
									<router-link :to="`/items/${item.id}`" class="link">{{ item.name }}</router-link>
								</td>
								<td>{{ item.quantity }} {{ item.unit }}</td>
								<td>{{ item.reserved }} {{ item.unit }}</td>
								<td>{{ item.available }} {{ item.unit }}</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="card">
					<h3>Последние документы</h3>
					<table class="table">
						<thead>
							<tr>
								<th>Номер</th>
								<th>Тип</th>
								<th>Дата</th>
								<th>Статус</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="doc in warehouse.recentDocuments" :key="doc.id">
								<td>
									<router-link :to="`/documents/${doc.id}`" class="link">{{ doc.number }}</router-link>
								</td>
								<td>{{ doc.type }}</td>
								<td>{{ doc.date }}</td>
								<td>{{ doc.status }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<ModalForm v-model="showDelete" title="Подтвердите удаление">
			<div>
				<p>Вы действительно хотите удалить склад "{{ warehouse?.name }}"? Это действие удалит локальные локальные
					данные.
				</p>
			</div>
			<template #footer>
				<button class="btn" type="button" @click="showDelete = false">Отмена</button>
				<button class="btn" type="button" style="background:#ff6b6b;color:white"
					@click="performDeleteWarehouse">Удалить</button>
			</template>
		</ModalForm>
	</div>
</template>

<style scoped>
.pageHeader {
	display: flex;
	align-items: center;
	margin-bottom: var(--space-4);
}

.headerLeft {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}

.backBtn {
	background: none;
	border: none;
	color: var(--muted);
	cursor: pointer;
	font-size: 1rem;
	padding: 0;
}

.content {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.statsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: var(--space-3);
}

.statCard {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: var(--space-3);
}

.statLabel {
	color: var(--muted);
	font-size: 0.9rem;
}

.statValue {
	font-size: 1.5rem;
	font-weight: 600;
	margin-top: 4px;
}

.grid2col {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--space-4);
}

.card {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: var(--space-4);
}

.table {
	width: 100%;
	border-collapse: collapse;
	margin-top: var(--space-3);
}

.table th,
.table td {
	text-align: left;
	padding: var(--space-2);
	border-bottom: 1px solid var(--border);
}

.table th {
	color: var(--muted);
	font-weight: 500;
}

.link {
	color: #646cff;
	text-decoration: none;
}

.link:hover {
	text-decoration: underline;
}
</style>
