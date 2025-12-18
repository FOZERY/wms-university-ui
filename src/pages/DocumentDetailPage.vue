<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import BaseButton from "../components/BaseButton.vue";

const route = useRoute();
const router = useRouter();
const documentId = route.params.id as string;

const document = ref<any>(null);
const loading = ref(true);
const editMode = ref(false);
const draft = ref<any>(null);

onMounted(async () => {
	// TODO: Fetch document by ID
	// document.value = await api.documents.getById(documentId);

	// Mock data for now — assign synchronously (no artificial delay)
	document.value = {
		id: documentId,
		number: "ПР-0001",
		type: "incoming",
		status: "draft",
		date: "2025-12-13",
		author: "storeKeeper",
		supplier: { id: 1, name: 'ООО "Поставщик"' },
		warehouseTo: { id: 1, name: "Основной склад" },
		items: [
			{ id: 1, name: "Гвозди", quantity: 100, unit: "кг", price: 50 },
			{ id: 2, name: "Доски", quantity: 20, unit: "шт", price: 500 },
		],
	};
	loading.value = false;
});

const goBack = () => router.back();

function openEdit() {
	if (!document.value) return;
	// shallow clone for editing (deep enough for our structure)
	draft.value = JSON.parse(JSON.stringify(document.value));
	editMode.value = true;
}

function cancelEdit() {
	draft.value = null;
	editMode.value = false;
}

function saveEdit() {
	if (!draft.value) return;
	// apply draft locally (no API call per instructions)
	document.value = JSON.parse(JSON.stringify(draft.value));
	draft.value = null;
	editMode.value = false;
}

function updateDraftItem(index: number, field: string, value: any) {
	if (!draft.value) return;
	const item = draft.value.items[index];
	if (!item) return;
	if (field === 'quantity' || field === 'price') {
		const num = Number(value);
		item[field] = Number.isNaN(num) ? 0 : num;
	} else {
		item[field] = value;
	}
}

function onQuantityInput(e: Event, index: number) {
	const v = (e.target as HTMLInputElement)?.value;
	updateDraftItem(index, 'quantity', v);
}

function onPriceInput(e: Event, index: number) {
	const v = (e.target as HTMLInputElement)?.value;
	updateDraftItem(index, 'price', v);
}
</script>

<template>
	<div>
		<div class="pageHeader">
			<div class="headerLeft">
				<button @click="goBack" class="backBtn">← Назад</button>
				<h1>Документ {{ document?.number }}</h1>
			</div>
			<div class="actions" v-if="document">
				<template v-if="!editMode">
					<BaseButton v-if="document.status === 'draft'" variant="primary" @click="openEdit">Редактировать</BaseButton>
					<BaseButton variant="secondary">Печать</BaseButton>
				</template>
				<template v-else>
					<BaseButton variant="secondary" @click="cancelEdit">Отмена</BaseButton>
					<BaseButton variant="primary" @click="saveEdit">Сохранить</BaseButton>
				</template>
			</div>
		</div>

		<div v-if="loading" class="loading">Загрузка...</div>

		<div v-else-if="document" class="content">
			<div class="card infoCard">
				<h3>Основная информация</h3>
				<div class="infoGrid">
					<div class="infoItem">
						<span class="label">Тип:</span>
						<span class="value">{{ document.type }}</span>
					</div>
					<div class="infoItem">
						<span class="label">Статус:</span>
						<span class="value status" :class="document.status">{{
							document.status
						}}</span>
					</div>
					<div class="infoItem">
						<span class="label">Дата:</span>
						<span class="value" v-if="!editMode">{{ document.date }}</span>
						<input v-else type="date" v-model="draft.date" />
					</div>
					<div class="infoItem">
						<span class="label">Автор:</span>
						<span class="value">{{ document.author }}</span>
					</div>
					<div class="infoItem" v-if="document.supplier">
						<span class="label">Поставщик:</span>
						<router-link :to="`/suppliers/${document.supplier.id}`" class="link">{{ document.supplier.name
						}}</router-link>
					</div>
					<div class="infoItem" v-if="document.warehouseTo">
						<span class="label">На склад:</span>
						<router-link :to="`/warehouses/${document.warehouseTo.id}`" class="link">{{ document.warehouseTo.name
						}}</router-link>
					</div>
				</div>
			</div>

			<div class="card itemsCard">
				<h3>Позиции</h3>
				<table class="table">
					<thead>
						<tr>
							<th>№</th>
							<th>Наименование</th>
							<th>Количество</th>
							<th>Ед. изм.</th>
							<th>Цена</th>
							<th>Сумма</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(item, index) in (editMode ? draft.items : document.items)" :key="item.id">
							<td>{{ index + 1 }}</td>
							<td>
								<router-link :to="`/items/${item.id}`" class="link">{{ item.name }}</router-link>
							</td>
							<td v-if="!editMode">{{ item.quantity }}</td>
							<td v-else>
								<input type="number" min="0" step="0.001" :value="item.quantity"
									@input="(e) => onQuantityInput(e, index)" />
							</td>
							<td>{{ item.unit }}</td>
							<td v-if="!editMode">{{ item.price }} ₽</td>
							<td v-else>
								<input type="number" min="0" step="0.01" :value="item.price" @input="(e) => onPriceInput(e, index)" />
							</td>
							<td>{{ (item.quantity * item.price) || 0 }} ₽</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<style scoped>
.pageHeader {
	display: flex;
	justify-content: space-between;
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

.backBtn:hover {
	color: var(--text);
}

.content {
	display: grid;
	gap: var(--space-4);
}

.card {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: var(--space-4);
}

.infoGrid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: var(--space-3);
	margin-top: var(--space-3);
}

.infoItem {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.label {
	color: var(--muted);
	font-size: 0.9rem;
}

.value {
	font-weight: 500;
}

.link {
	color: #646cff;
	text-decoration: none;
}

.link:hover {
	text-decoration: underline;
}

.status.draft {
	color: #fbbf24;
}

.status.completed {
	color: #34d399;
}

.status.cancelled {
	color: #f87171;
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
</style>
