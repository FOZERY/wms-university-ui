<script setup lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import BaseButton from "../components/BaseButton.vue";
import { nomenclatureApi } from "../shared/api/nomenclature";
import { suppliersApi } from "../shared/api/suppliers";
import { warehousesApi } from "../shared/api/warehouses";
import { documentsApi } from "../shared/api/documents";
import type { Item, Supplier, Warehouse } from "../shared/api/types";
const route = useRoute();
const router = useRouter();

const isNew = computed(() => String(route.params.id || '') === 'new' || !route.params.id);

const form = ref<DocForm>({
	type: "incoming",
	date: new Date().toISOString().split("T")[0],
	warehouseFromId: null,
	warehouseToId: null,
	supplierId: null,
	comment: "",
	items: [] as any[],
});

const itemsList = ref<Item[]>([]);
const suppliersList = ref<Supplier[]>([]);
const warehousesList = ref<Warehouse[]>([]);

const availableUnits = computed(() => {
	const set = new Set<string>();
	for (const it of itemsList.value) if (it.unit) set.add(it.unit);
	// ensure common units available
	['шт', 'кг', 'л'].forEach(u => set.add(u));
	return Array.from(set);
});

function isWeightUnit(unit: string | null | undefined) {
	if (!unit) return false;
	const s = String(unit).toLowerCase();
	return s.includes('kg') || s.includes('кг') || s.includes('г') || s.includes('л') || s.includes('л');
}

function onItemSelect(index: number) {
	const row = form.value.items[index];
	if (!row) return;
	const sel = itemsList.value.find(i => i.id === Number(row.itemId));
	if (sel && sel.unit) {
		row.unit = sel.unit;
	}
}

const loading = ref(false);
const headerErrors = ref<Record<string, string>>({});
const itemsErrors = ref<Record<number, Record<string, string>>>({});

function clearErrors() {
	headerErrors.value = {};
	itemsErrors.value = {};
}

function validateForm(): boolean {
	clearErrors();

	const type = form.value.type;

	// header validations per type
	if (!form.value.items || form.value.items.length === 0) {
		headerErrors.value.general = 'Добавьте хотя бы одну позицию';
	}

	if (type === 'incoming') {
		if (form.value.supplierId == null) headerErrors.value.supplier = 'Поставщик обязателен для приходного документа';
		if (form.value.warehouseToId == null) headerErrors.value.warehouseTo = 'Склад получатель обязателен для приходного документа';
	}

	if (type === 'transfer') {
		if (form.value.warehouseFromId == null) headerErrors.value.warehouseFrom = 'Склад отправитель обязателен для перемещения';
		if (form.value.warehouseToId == null) headerErrors.value.warehouseTo = 'Склад получатель обязателен для перемещения';
		if (form.value.warehouseFromId != null && form.value.warehouseToId != null && form.value.warehouseFromId === form.value.warehouseToId) headerErrors.value.warehouses = 'Склады отправитель и получатель не должны совпадать';
	}

	if (type === 'production') {
		if (form.value.warehouseFromId == null) headerErrors.value.warehouseFrom = 'Склад списания обязателен для производства';
		if (form.value.warehouseToId == null) headerErrors.value.warehouseTo = 'Склад приходования обязателен для производства';
	}

	// items validation
	form.value.items.forEach((row, idx) => {
		const rowErr: Record<string, string> = {};
		if (row.itemId == null) rowErr.item = 'Выберите номенклатуру';
		const q = Number(row.quantity);
		if (!isFinite(q) || q <= 0) rowErr.quantity = 'Количество должно быть > 0';
		if (type === 'production' && !row.direction) rowErr.direction = 'Укажите направление для позиции в производстве';
		if (Object.keys(rowErr).length > 0) itemsErrors.value[idx] = rowErr;
	});

	return Object.keys(headerErrors.value).length === 0 && Object.keys(itemsErrors.value).length === 0;
}

const isFormValid = computed(() => validateForm());

onMounted(async () => {
	loading.value = true;
	try {
		// load selects data for creation/edit
		const [noms, sups, whs] = await Promise.all([
			nomenclatureApi.list({ limit: 100 }),
			suppliersApi.list({ limit: 100 }),
			warehousesApi.list({ limit: 100 }),
		]);
		itemsList.value = noms;
		suppliersList.value = sups;
		warehousesList.value = whs;

		if (!isNew.value) {
			// TODO: load existing document when editing (not implemented)
		}
	} catch (e) {
		console.error(e);
		alert("Не удалось загрузить справочники для создания документа");
	} finally {
		loading.value = false;
	}
});

const save = async () => {
	// basic validation
	if (!form.value.items || form.value.items.length === 0) {
		alert("Добавьте хотя бы одну позицию");
		return;
	}

	// build payload — omit optional fields when not provided (do not send null)
	const payload: any = {
		type: form.value.type,
		date: form.value.date,
		items: form.value.items.map((it: any) => ({
			itemId: Number(it.itemId),
			quantity: String(it.quantity),
			...(it.direction ? { direction: it.direction } : {}),
		})),
	};

	if (form.value.warehouseFromId != null) payload.warehouseFromId = Number(form.value.warehouseFromId);
	if (form.value.warehouseToId != null) payload.warehouseToId = Number(form.value.warehouseToId);
	if (form.value.supplierId != null) payload.supplierId = Number(form.value.supplierId);
	if (form.value.comment && String(form.value.comment).trim().length > 0) payload.comment = String(form.value.comment).trim();

	try {
		loading.value = true;
		const resp = await documentsApi.create(payload);
		const created = (resp && (resp as any).data) || resp;
		router.push(`/documents/${created.id}`);
	} catch (e) {
		console.error(e);
		alert("Не удалось создать документ");
	} finally {
		loading.value = false;
	}
};

const cancel = () => router.back();

const addItem = () => {
	form.value.items.push({ itemId: null, quantity: 1, unit: itemsList.value[0]?.unit || 'шт', direction: undefined });
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
						<select v-model.number="form.supplierId">
							<option :value="null">Выберите</option>
							<option v-for="s in suppliersList" :key="s.id" :value="s.id">{{ s.name }}</option>
						</select>
						<div v-if="headerErrors.supplier" class="fieldError">{{ headerErrors.supplier }}</div>
					</div>

					<div class="formGroup" v-if="['transfer', 'production'].includes(form.type)">
						<label>Склад отправитель (Списание)</label>
						<select v-model.number="form.warehouseFromId">
							<option :value="null">Выберите</option>
							<option v-for="w in warehousesList" :key="w.id" :value="w.id">{{ w.name }}</option>
						</select>
						<div v-if="headerErrors.warehouseFrom" class="fieldError">{{ headerErrors.warehouseFrom }}</div>
					</div>

					<div class="formGroup" v-if="['incoming', 'transfer', 'production'].includes(form.type)">
						<label>Склад получатель (Приход)</label>
						<select v-model.number="form.warehouseToId">
							<option :value="null">Выберите</option>
							<option v-for="w in warehousesList" :key="w.id" :value="w.id">{{ w.name }}</option>
						</select>
						<div v-if="headerErrors.warehouseTo" class="fieldError">{{ headerErrors.warehouseTo }}</div>
						<div v-if="headerErrors.warehouses" class="fieldError">{{ headerErrors.warehouses }}</div>
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
							<th v-if="form.type === 'production'">Направление</th>
							<th>Действия</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(item, index) in form.items" :key="index">
							<td>
								<select v-model.number="item.itemId" @change="() => onItemSelect(index)">
									<option :value="null">Выберите</option>
									<option v-for="it in itemsList" :key="it.id" :value="it.id">{{ it.name }} ({{ it.code }})</option>
								</select>
								<div v-if="itemsErrors[index] && itemsErrors[index].item" class="rowError">{{ itemsErrors[index].item }}
								</div>
							</td>
							<td>
								<input type="number" v-model.number="item.quantity" :min="isWeightUnit(item.unit) ? 0.001 : 1"
									:step="isWeightUnit(item.unit) ? 0.001 : 1" />
								<div v-if="itemsErrors[index] && itemsErrors[index].quantity" class="rowError">{{
									itemsErrors[index].quantity }}</div>
							</td>
							<td>
								<select v-model="item.unit">
									<option v-for="u in availableUnits" :key="u" :value="u">{{ u }}</option>
								</select>
							</td>
							<td v-if="form.type === 'production'">
								<select v-model="item.direction">
									<option :value="undefined">Не указано</option>
									<option value="out">Списание (out)</option>
									<option value="in">Оприходование (in)</option>
								</select>
								<div v-if="itemsErrors[index] && itemsErrors[index].direction" class="rowError">{{
									itemsErrors[index].direction }}</div>
							</td>
							<td>
								<button type="button" class="btnDelete" @click="removeItem(index)">
									✕
								</button>
							</td>
						</tr>
						<tr v-if="form.items.length === 0">
							<td :colspan="form.type === 'production' ? 5 : 4" class="emptyRow">
								Нет позиций. Добавьте товары.
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="actions">
				<BaseButton type="button" variant="secondary" @click="cancel">Отмена</BaseButton>
				<BaseButton :disabled="!isFormValid || loading" type="submit" variant="primary">Сохранить</BaseButton>
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

.fieldError {
	color: #ff6b6b;
	font-size: 0.85rem;
	margin-top: 6px;
}

.rowError {
	color: #ff6b6b;
	font-size: 0.8rem;
	margin-top: 4px;
}
</style>
