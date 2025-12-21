<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import ModalForm from "../components/ModalForm.vue";
import FormField from "../components/FormField.vue";
import { useAuthStore } from "../stores/auth";
import { getPermissions } from "../shared/auth/permissions";
import { nomenclatureApi } from "../shared/api/nomenclature";
import { stockApi } from "../shared/api/stock";
import { documentsApi } from "../shared/api/documents";
import { mapItemTypeToRu, mapDocumentTypeToRu } from "../shared/utils/format";

const route = useRoute();
const router = useRouter();
const itemId = route.params.id as string;

const item = ref<any>(null);
const loading = ref(true);
const balances = ref<any[]>([]);
const loadingBalances = ref(false);
const showEdit = ref(false);
const saving = ref(false);
const formModel = ref<any>({});
const showDelete = ref(false);
const history = ref<Array<any>>([]);

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));


onMounted(async () => {
	loading.value = true;
	try {
		const id = Number(itemId);
		const data = await nomenclatureApi.getById(id);
		item.value = data;

		// load stock balances for this item
		try {
			loadingBalances.value = true;
			const resp = await stockApi.getByItem(id);
			const list = (resp && (resp as any).data) || resp || [];
			balances.value = Array.isArray(list) ? list : [];
		} catch (err) {
			console.error('Failed to load balances for item', err);
		} finally {
			loadingBalances.value = false;
		}

		// load related documents history for this item
		try {
			await loadHistoryForItem(id);
		} catch (err) {
			console.error('Failed to load history', err);
		}
	} catch (e: any) {
		console.error(e);
		alert(e?.response?.data?.message || e?.message || 'Не удалось загрузить номенклатуру');
		router.back();
	} finally {
		loading.value = false;
	}
});

async function loadHistoryForItem(id: number) {
	// fetch documents that reference this item
	const listResp = await documentsApi.getAll({ itemId: id, limit: 50, sort: { date: 'desc' } });
	const docs: any[] = listResp.data || listResp;

	// for each document fetch details to extract quantity for this item
	const details = await Promise.all(docs.map(d => documentsApi.getById(d.id).then(r => r.data)));

	history.value = docs.map((d, idx) => {
		const det = details[idx];
		const itemEntry = det.items?.find((it: any) => Number(it.itemId) === Number(id));
		let quantity: string | null = null;
		if (itemEntry) {
			const q = itemEntry.quantity;
			// if direction provided and is 'out' make negative display
			if (itemEntry.direction === 'out') quantity = `-${q}`;
			else quantity = String(q);
		}
		return {
			id: d.id,
			number: d.number,
			type: d.type,
			date: d.date,
			quantity,
		};
	});
}

const goBack = () => router.back();

function openEdit() {
	formModel.value = {
		code: item.value.code,
		name: item.value.name,
		unit: item.value.unit,
		type: item.value.type,
		minQuantity: item.value.minQuantity,
		description: item.value.description,
	};
	showEdit.value = true;
}

function confirmDeleteItem() {
	showDelete.value = true;
}

async function performDeleteItem() {
	if (!item.value) return;
	try {
		await nomenclatureApi.delete(Number(item.value.id));
		showDelete.value = false;
		router.back();
	} catch (e: any) {
		alert(e?.response?.data?.message || e?.message || 'Не удалось удалить позицию');
	}
}

async function submitEdit() {
	saving.value = true;
	try {
		if (!formModel.value.name) throw new Error('Название обязательно');
		const payload: any = {
			code: String(formModel.value.code),
			name: String(formModel.value.name),
			unit: String(formModel.value.unit || ''),
			type: String(formModel.value.type || 'material'),
			minQuantity: String(formModel.value.minQuantity || '0'),
			description: formModel.value.description == null ? null : String(formModel.value.description),
		};
		await nomenclatureApi.patch(Number(item.value.id), payload);
		// reload current item
		const refreshed = await nomenclatureApi.getById(Number(item.value.id));
		item.value = refreshed;
		showEdit.value = false;
	} catch (e: any) {
		alert(e?.response?.data?.message || e?.message || 'Не удалось сохранить');
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
				<h1>{{ item?.name || "Номенклатура" }}</h1>
			</div>
			<div class="actions">
				<button v-if="permissions.canEditNomenclature" class="btn" type="button"
					@click="openEdit">Редактировать</button>
				<button v-if="permissions.canEditNomenclature" class="btn" type="button"
					style="margin-left:8px;background:#ff6b6b;color:white" @click="confirmDeleteItem">Удалить</button>
			</div>
		</div>

		<ModalForm v-model="showEdit" title="Редактировать позицию">
			<div>
				<FormField label="Код" v-model="formModel.code" placeholder="ART-001" />
				<FormField label="Название" v-model="formModel.name" placeholder="наименование" />
				<FormField label="Единица" v-model="formModel.unit" placeholder="шт, кг" />
				<FormField label="Тип" type="select"
					:options="[{ value: 'material', label: 'Материал' }, { value: 'product', label: 'Готовая продукция' }]"
					v-model="formModel.type" />
				<FormField label="Мин. остаток" v-model="formModel.minQuantity" placeholder="0" />
				<FormField label="Описание" type="textarea" v-model="formModel.description" placeholder="необязательно" />
			</div>

			<template #footer>
				<button class="btn" type="button" @click="showEdit = false">Отмена</button>
				<button class="btn btnPrimary" type="button" @click="submitEdit" :disabled="saving">{{ saving ? 'Сохраняю...' :
					'Сохранить' }}</button>
			</template>
		</ModalForm>

		<div v-if="loading" class="loading">Загрузка...</div>

		<div v-else-if="item" class="content">
			<div class="card infoCard">
				<h3>Информация</h3>
				<div class="infoGrid">
					<div class="infoItem">
						<span class="label">Артикул:</span>
						<span class="value">{{ item.code }}</span>
					</div>
					<div class="infoItem">
						<span class="label">Ед. изм.:</span>
						<span class="value">{{ item.unit }}</span>
					</div>
					<div class="infoItem">
						<span class="label">Тип:</span>
						<span class="value">{{ mapItemTypeToRu(item.type) }}</span>
					</div>
					<div class="infoItem">
						<span class="label">Мин. остаток:</span>
						<span class="value">{{ item.minQuantity }}</span>
					</div>
					<div class="infoItem fullWidth">
						<span class="label">Описание:</span>
						<span class="value">{{ item.description }}</span>
					</div>
				</div>
			</div>

			<div class="grid2col">
				<div class="card">
					<h3>Остатки по складам</h3>
					<table class="table">
						<thead>
							<tr>
								<th>Склад</th>
								<th>Всего</th>
								<th>Резерв</th>
								<th>Доступно</th>
							</tr>
						</thead>
						<tbody>
							<tr v-if="loadingBalances">
								<td colspan="4">Загрузка...</td>
							</tr>
							<tr v-else-if="!balances.length">
								<td colspan="4">Нет остатков</td>
							</tr>
							<tr v-else v-for="balance in balances" :key="balance.warehouseId">
								<td>
									<router-link :to="`/warehouses/${balance.warehouseId}`" class="link">{{ balance.warehouseName
										}}</router-link>
								</td>
								<td>{{ balance.quantity }}</td>
								<td>{{ balance.reserved }}</td>
								<td>{{ balance.available }}</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="card">
					<h3>История движения</h3>
					<table class="table">
						<thead>
							<tr>
								<th>Дата</th>
								<th>Документ</th>
								<th>Тип</th>
								<th>Кол-во</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="rec in history" :key="rec.id">
								<td>{{ rec.date }}</td>
								<td>
									<router-link :to="`/documents/${rec.id}`" class="link">{{ rec.number }}</router-link>
								</td>
								<td>{{ mapDocumentTypeToRu(rec.type) }}</td>
								<td :class="(rec.quantity != null && Number(rec.quantity) > 0) ? 'positive' : 'negative'">
									{{ (rec.quantity != null && Number(rec.quantity) > 0) ? '+' : '' }}{{ rec.quantity ?? '-' }}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<ModalForm v-model="showDelete" title="Подтвердите удаление">
			<div>
				<p>Вы действительно хотите удалить номенклатуру "{{ item?.name }}"? Это действие необратимо.</p>
			</div>
			<template #footer>
				<button class="btn" type="button" @click="showDelete = false">Отмена</button>
				<button class="btn" type="button" style="background:#ff6b6b;color:white"
					@click="performDeleteItem">Удалить</button>
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

.infoItem.fullWidth {
	grid-column: 1 / -1;
}

.label {
	color: var(--muted);
	font-size: 0.9rem;
}

.value {
	font-weight: 500;
}

.grid2col {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--space-4);
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

.positive {
	color: #34d399;
}

.negative {
	color: #f87171;
}
</style>
