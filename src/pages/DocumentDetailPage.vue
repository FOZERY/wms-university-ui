<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { getPermissions } from "../shared/auth/permissions";
import BaseButton from "../components/BaseButton.vue";
import ModalForm from "../components/ModalForm.vue";
import { documentsApi } from "../shared/api/documents";
import { nomenclatureApi } from "../shared/api/nomenclature";
import { suppliersApi } from "../shared/api/suppliers";
import { warehousesApi } from "../shared/api/warehouses";
import { mapDocumentTypeToRu, mapDocumentStatusToRu } from "../shared/utils/format";

const route = useRoute();
const router = useRouter();
const documentId = route.params.id as string;

const document = ref<any>(null);
const loading = ref(true);
const editMode = ref(false);
const draft = ref<any>(null);
const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));
const showCancel = ref(false);

const authorName = computed(() => {
	const a = document.value?.author;
	if (!a) return document.value?.userId || "-";
	// format: Lastname Firstname Middlename
	return `${a.lastname || ""} ${a.firstname || ""}${a.middlename ? " " + a.middlename : ""}`.trim();
});

async function loadDocument() {
	loading.value = true;
	try {
		const resp = await documentsApi.getById(Number(documentId));
		const data = (resp && (resp as any).data) || resp || null;
		if (!data) throw new Error("Документ не найден");

		// enrich supplier/warehouses if backend returned only ids
		if (!data.supplier && data.supplierId) {
			try {
				const s = await suppliersApi.getById(Number(data.supplierId));
				data.supplier = { id: s.id, name: s.name };
			} catch (err) {
				// ignore
			}
		}

		if (!data.warehouseTo && data.warehouseToId) {
			try {
				const w = await warehousesApi.getById(Number(data.warehouseToId));
				data.warehouseTo = { id: w.id, name: w.name };
			} catch (err) { }
		}

		if (!data.warehouseFrom && data.warehouseFromId) {
			try {
				const w = await warehousesApi.getById(Number(data.warehouseFromId));
				data.warehouseFrom = { id: w.id, name: w.name };
			} catch (err) { }
		}

		// enrich items with nomenclature names/units when possible
		if (Array.isArray(data.items) && data.items.length > 0) {
			await Promise.all(
				data.items.map(async (it: any) => {
					// backend may return nested `item` object
					if (it.item) {
						it.itemId = it.itemId || it.item.id;
						it.itemName = it.itemName || it.item.name;
						it.unit = it.unit || it.item.unit;
					} else if (!it.itemName && it.itemId) {
						try {
							const ni = await nomenclatureApi.getById(Number(it.itemId));
							it.itemName = ni.name;
							it.unit = it.unit || ni.unit;
						} catch (err) {
							// ignore per-item fetch failures
						}
					}
					// normalize quantity/price to displayable values
					if (it.quantity == null) it.quantity = "0";
					if (it.price == null) it.price = null;
				})
			);
		}

		document.value = data;
	} catch (e: any) {
		console.error(e);
		alert(e?.message || "Не удалось загрузить документ");
		router.back();
	} finally {
		loading.value = false;
	}
}

onMounted(() => {
	loadDocument();
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

function confirmCancelDocument() {
	showCancel.value = true;
}

function performCancelDocument() {
	if (!document.value) return;
	// call backend to update status, then reload
	(async () => {
		try {
			await documentsApi.updateStatus(Number(document.value.id), 'cancelled');
			showCancel.value = false;
			await loadDocument();
		} catch (err) {
			alert('Не удалось отменить документ');
		}
	})();
}

async function printDocument() {
	if (!document.value) return;
	try {
		const resp = await documentsApi.print(document.value.id);
		const blob = (resp && (resp as any).data) || resp;
		const cd = resp?.headers?.["content-disposition"] || resp?.headers?.["Content-Disposition"] || "";

		function parseFilename(cdHeader: string) {
			if (!cdHeader) return undefined;
			const m1 = /filename\*=UTF-8''([^;\n\r]+)/i.exec(cdHeader);
			if (m1) return decodeURIComponent(m1[1]);
			const m2 = /filename="?([^";]+)"?/i.exec(cdHeader);
			if (m2) return m2[1];
			return undefined;
		}

		const filename = parseFilename(cd) || `document-${document.value.id}.pdf`;
		const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' }));
		const win = window.open(url);
		if (!win) {
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 5000);
			return;
		}
		const tryPrint = () => {
			try {
				win.focus();
				win.print();
			} catch (e) {
				setTimeout(tryPrint, 500);
			}
		};
		setTimeout(tryPrint, 500);
		setTimeout(() => URL.revokeObjectURL(url), 10000);
	} catch (err) {
		console.error(err);
		alert("Не удалось сформировать печать");
	}
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
					<BaseButton v-if="permissions.canCancelDocuments && document.status !== 'cancelled'" variant="default"
						@click="confirmCancelDocument">Отменить</BaseButton>
					<BaseButton variant="secondary" @click="printDocument">Печать</BaseButton>
				</template>
				<template v-else>
					<BaseButton variant="secondary" @click="cancelEdit">Отмена</BaseButton>
					<BaseButton variant="primary" @click="saveEdit">Сохранить</BaseButton>
				</template>
			</div>
		</div>

		<ModalForm v-model="showCancel" title="Подтвердите отмену">
			<div>
				<p>Вы действительно хотите отменить этот документ? Статус документа станет "cancelled".</p>
			</div>
			<template #footer>
				<button class="btn" type="button" @click="showCancel = false">Отмена</button>
				<button class="btn" type="button" style="background:#ff6b6b;color:white"
					@click="performCancelDocument">Отменить</button>
			</template>
		</ModalForm>

		<div v-if="loading" class="loading">Загрузка...</div>

		<div v-else-if="document" class="content">
			<div class="card infoCard">
				<h3>Основная информация</h3>
				<div class="infoGrid">
					<div class="infoItem">
						<span class="label">Тип:</span>
						<span class="value">{{ mapDocumentTypeToRu(document.type) }}</span>
					</div>
					<div class="infoItem">
						<span class="label">Статус:</span>
						<span class="value status" :class="document.status">{{ mapDocumentStatusToRu(document.status) }}</span>
					</div>
					<div class="infoItem">
						<span class="label">Дата:</span>
						<span class="value" v-if="!editMode">{{ document.date }}</span>
						<input v-else type="date" v-model="draft.date" />
					</div>
					<div class="infoItem">
						<span class="label">Автор:</span>
						<span class="value">{{ authorName }}</span>
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
						<tr v-for="(item, index) in (editMode ? draft.items : document.items)" :key="item.id || item.itemId">
							<td>{{ index + 1 }}</td>
							<td>
								<router-link :to="`/items/${item.itemId || item.id}`" class="link">{{ item.itemName || item.name ||
									item.itemId || item.id }}</router-link>
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
							<td>{{ (Number(item.quantity) || 0) * (Number(item.price) || 0) }} ₽</td>
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
