<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import BaseButton from "../components/BaseButton.vue";

const route = useRoute();
const router = useRouter();
const isNew = route.path.includes("/new");

type DocForm = {
	type: string;
	date?: string;
	warehouseFromId: number | null;
	warehouseToId: number | null;
	supplierId: number | null;
	comment: string;
	items: any[];
};

const form = ref<DocForm>({
	type: "incoming",
	date: new Date().toISOString().split("T")[0],
	warehouseFromId: null,
	warehouseToId: null,
	supplierId: null,
	comment: "",
	items: [] as any[],
});

const loading = ref(false);

onMounted(async () => {
	if (!isNew) {
		loading.value = true;
		// Mock fetch existing - synchronous (no artificial delay)
		form.value = {
			type: "incoming",
			date: "2025-12-13",
			warehouseFromId: null,
			warehouseToId: 1,
			supplierId: 1,
			comment: "Тестовый документ",
			items: [{ itemId: 1, name: "Гвозди", quantity: 100, unit: "кг" }],
		};
		loading.value = false;
	}
});

const save = async () => {
	// TODO: API call
	alert("Сохранено (mock)");
	router.push("/documents");
};

const cancel = () => router.back();

const addItem = () => {
	form.value.items.push({ itemId: null, quantity: 1, unit: "шт" });
};

const removeItem = (index: number) => {
	form.value.items.splice(index, 1);
};
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>
				{{ isNew ? "Создание документа" : "Редактирование документа" }}
			</h1>
		</div>

		<div v-if="loading" class="loading">Загрузка...</div>

		<form v-else @submit.prevent="save" class="formContainer">
			<div class="card">
				<h3>Шапка документа</h3>
				<div class="formGrid">
					<div class="formGroup">
						<label>Тип документа</label>
						<select v-model="form.type" :disabled="!isNew">
							<option value="incoming">Приход (Incoming)</option>
							<option value="transfer">
								Перемещение (Transfer)
							</option>
							<option value="production">
								Производство (Production)
							</option>
						</select>
					</div>

					<div class="formGroup">
						<label>Дата</label>
						<input type="date" v-model="form.date" required />
					</div>

					<div class="formGroup" v-if="form.type === 'incoming'">
						<label>Поставщик</label>
						<select v-model="form.supplierId">
							<option :value="1">ООО "Поставщик"</option>
							<option :value="2">ИП Иванов</option>
						</select>
					</div>

					<div class="formGroup" v-if="['transfer', 'production'].includes(form.type)">
						<label>Склад отправитель (Списание)</label>
						<select v-model="form.warehouseFromId">
							<option :value="1">Основной склад</option>
							<option :value="2">Цех №1</option>
						</select>
					</div>

					<div class="formGroup" v-if="
						['incoming', 'transfer', 'production'].includes(
							form.type
						)
					">
						<label>Склад получатель (Приход)</label>
						<select v-model="form.warehouseToId">
							<option :value="1">Основной склад</option>
							<option :value="2">Цех №1</option>
						</select>
					</div>
				</div>

				<div class="formGroup fullWidth">
					<label>Комментарий</label>
					<textarea v-model="form.comment" rows="2"></textarea>
				</div>
			</div>

			<div class="card">
				<div class="cardHeader">
					<h3>Позиции</h3>
					<BaseButton type="button" variant="secondary" @click="addItem">+ Добавить строку</BaseButton>
				</div>

				<table class="table">
					<thead>
						<tr>
							<th>Номенклатура</th>
							<th>Количество</th>
							<th>Ед. изм.</th>
							<th>Действия</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(item, index) in form.items" :key="index">
							<td>
								<select v-model="item.itemId">
									<option :value="1">Гвозди</option>
									<option :value="2">Доски</option>
									<option :value="3">Краска</option>
								</select>
							</td>
							<td>
								<input type="number" v-model="item.quantity" min="0.001" step="0.001" />
							</td>
							<td>{{ item.unit || "шт" }}</td>
							<td>
								<button type="button" class="btnDelete" @click="removeItem(index)">
									✕
								</button>
							</td>
						</tr>
						<tr v-if="form.items.length === 0">
							<td colspan="4" class="emptyRow">
								Нет позиций. Добавьте товары.
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="actions">
				<BaseButton type="button" variant="secondary" @click="cancel">Отмена</BaseButton>
				<BaseButton type="submit" variant="primary">Сохранить</BaseButton>
			</div>
		</form>
	</div>
</template>

<style scoped>
.pageHeader {
	margin-bottom: var(--space-4);
}

.formContainer {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	max-width: 800px;
}

.card {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: var(--space-4);
}

.cardHeader {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: var(--space-3);
}

.formGrid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--space-3);
	margin-bottom: var(--space-3);
}

.formGroup {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.formGroup.fullWidth {
	grid-column: 1 / -1;
}

label {
	font-size: 0.9rem;
	color: var(--muted);
}

input,
select,
textarea {
	padding: 8px;
	border: 1px solid var(--border);
	border-radius: 4px;
	background: var(--surface-2);
	color: var(--text);
}

.table {
	width: 100%;
	border-collapse: collapse;
}

.table th,
.table td {
	padding: var(--space-2);
	border-bottom: 1px solid var(--border);
	text-align: left;
}

.btnDelete {
	background: none;
	border: none;
	color: #f87171;
	cursor: pointer;
	font-size: 1.2rem;
}

.emptyRow {
	text-align: center;
	color: var(--muted);
	padding: var(--space-4);
}

.actions {
	display: flex;
	justify-content: flex-end;
	gap: var(--space-3);
}
</style>
