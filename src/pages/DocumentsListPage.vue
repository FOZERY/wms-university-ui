<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import useDebounce from "../composables/useDebounce";
import BaseButton from "../components/BaseButton.vue";
import EditableTable from "../components/EditableTable.vue";
import ModalForm from "../components/ModalForm.vue";
import { useAuthStore } from "../stores/auth";
import { documentsApi } from "../shared/api/documents";
import type { DocumentListItem, DocumentType, DocumentStatus } from "../shared/api/types";
import { mapDocumentTypeToRu, mapDocumentStatusToRu } from "../shared/utils/format";

const auth = useAuthStore();

const isLoading = ref(false);
const error = ref<string | null>(null);
const documents = ref<DocumentListItem[]>([]);

const searchQuery = ref("");
const debouncedSearch = useDebounce(searchQuery, 250);

const selectedType = ref<DocumentType | "">("");
const selectedStatus = ref<DocumentStatus | "">("");
const dateFrom = ref<string | null>(null);
const dateTo = ref<string | null>(null);
const showDatePicker = ref(false);
const tempDateFrom = ref<string | null>(null);
const tempDateTo = ref<string | null>(null);
const datePanelRef = ref<HTMLElement | null>(null);

const sortRules = ref<Array<{ field: keyof DocumentListItem; direction: "asc" | "desc" }>>([]);

function clearSearch() {
	searchQuery.value = "";
	try {
		debouncedSearch.value = "";
	} catch { }
}

// use shared mapper `mapDocumentTypeToRu` from utils

async function printDocument(d: DocumentListItem) {
	try {
		const resp = await documentsApi.print(d.id);
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

		const filename = parseFilename(cd) || `document-${d.id}.pdf`;

		const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' }));
		const win = window.open(url);
		if (!win) {
			// popup blocked: fallback to download
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 5000);
			return;
		}
		// try to trigger print in the new tab; retry a few times
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
		console.error("printDocument error", err);
		alert("Не удалось сформировать печать");
	}
}

// cancel flow
const showCancel = ref(false);
const cancelTarget = ref<number | null>(null);

function confirmCancel(id: number) {
	cancelTarget.value = id;
	showCancel.value = true;
}

async function performCancel() {
	if (cancelTarget.value == null) return;
	try {
		await documentsApi.updateStatus(cancelTarget.value, 'cancelled');
		showCancel.value = false;
		cancelTarget.value = null;
		await load();
	} catch (e) {
		alert('Не удалось отменить документ');
	}
}

async function load() {
	isLoading.value = true;
	error.value = null;
	try {
		const query: any = {
			limit: 50,
			offset: 0,
		};

		const q = debouncedSearch.value.trim();
		if (q) query.search = q;

		if (selectedType.value) query.type = selectedType.value;
		if (selectedStatus.value) query.status = selectedStatus.value;
		if (dateFrom.value) query.dateFrom = dateFrom.value;
		if (dateTo.value) query.dateTo = dateTo.value;

		if (sortRules.value.length > 0) {
			const sortObj: Record<string, "asc" | "desc"> = {};
			for (const r of sortRules.value) sortObj[String(r.field)] = r.direction;
			query.sort = sortObj;
		}

		const resp = await documentsApi.getAll(query);
		// documentsApi.getAll returns axios response; handle both
		documents.value = (resp && (resp as any).data) || resp || [];
	} catch (e) {
		console.error(e);
		error.value = "Не удалось загрузить документы.";
	} finally {
		isLoading.value = false;
	}
}

watch(debouncedSearch, () => load());

watch([selectedType, selectedStatus, dateFrom, dateTo], () => load());

// click outside handler to close date picker
function onDocumentClick(e: MouseEvent) {
	const el = datePanelRef.value as HTMLElement | null;
	if (!el) return;
	if (showDatePicker.value && e.target instanceof Node && !el.contains(e.target)) {
		showDatePicker.value = false;
	}
}

// Date picker controls
function toggleDatePicker() {
	// copy current values to temp fields and toggle visibility
	tempDateFrom.value = dateFrom.value;
	tempDateTo.value = dateTo.value;
	showDatePicker.value = !showDatePicker.value;
}

function applyDateRange() {
	dateFrom.value = tempDateFrom.value;
	dateTo.value = tempDateTo.value;
	showDatePicker.value = false;
}

function cancelDatePicker() {
	showDatePicker.value = false;
}

function clearDateRange() {
	tempDateFrom.value = null;
	tempDateTo.value = null;
	dateFrom.value = null;
	dateTo.value = null;
	showDatePicker.value = false;
}

onMounted(() => {
	window.addEventListener('click', onDocumentClick);
});

// cleanup
import { onBeforeUnmount } from 'vue';
onBeforeUnmount(() => {
	window.removeEventListener('click', onDocumentClick);
});

function onTableSort(rules: Array<{ field: keyof DocumentListItem; direction: "asc" | "desc" }>) {
	sortRules.value = rules;
	load();
}

onMounted(load);

const columns = computed(() => [
	{ key: "id" as keyof DocumentListItem, label: "ID", width: "60px" },
	{ key: "number" as keyof DocumentListItem, label: "Номер" },
	{ key: "type" as keyof DocumentListItem, label: "Тип", format: mapDocumentTypeToRu },
	{ key: "status" as keyof DocumentListItem, label: "Статус", format: mapDocumentStatusToRu },
	{ key: "date" as keyof DocumentListItem, label: "Дата" },
	// author column: show formatted name, disable sorting
	{
		key: "author" as keyof DocumentListItem, label: "Автор", format: (a: any) => {
			if (!a) return "-";
			if (typeof a === 'string') return a;
			return `${a.lastname || ''} ${a.firstname || ''}${a.middlename ? ' ' + a.middlename : ''}`.trim();
		}, sortable: false
	},
]);
</script>

<template>
	<div>
		<div class="pageHeader">
			<div class="leftGroup">
				<h1>Документы</h1>
				<div class="searchWrap">
					<input v-model="searchQuery" class="searchInput" placeholder="Поиск по номеру, автору..." />
					<button v-if="searchQuery" class="clearButton" type="button" @click="clearSearch">×</button>
				</div>
			</div>

			<div class="actions">
				<label class="muted">
					Тип:&nbsp;
					<select v-model="selectedType" class="select">
						<option value="">Все</option>
						<option value="incoming">Приход</option>
						<option value="transfer">Перемещение</option>
						<option value="production">Производство</option>
					</select>
				</label>

				<label class="muted">
					Статус:&nbsp;
					<select v-model="selectedStatus" class="select">
						<option value="">Все</option>
						<option value="draft">Черновик</option>
						<option value="completed">Проведён</option>
						<option value="cancelled">Отменён</option>
					</select>
				</label>

				<div class="muted dateRangeWrap" ref="datePanelRef">
					<button type="button" class="btn dateRangeBtn" @click.stop="toggleDatePicker">
						<span v-if="dateFrom || dateTo">{{ dateFrom || '—' }} — {{ dateTo || '—' }}</span>
						<span v-else>Период</span>
					</button>

					<div v-if="showDatePicker" class="datePanel">
						<div class="dateInputs">
							<label>С:&nbsp;<input type="date" v-model="tempDateFrom" class="select dateInput" /></label>
							<label>По:&nbsp;<input type="date" v-model="tempDateTo" class="select dateInput" /></label>
						</div>
						<div class="dateActions">
							<button class="btn" type="button" @click="cancelDatePicker">Отмена</button>
							<button class="btn btnPrimary" type="button" @click="applyDateRange">Применить</button>
							<button class="btn" type="button" @click="clearDateRange">Очистить</button>
						</div>
					</div>
				</div>

				<BaseButton variant="primary" @click="$router.push('/documents/new')">Создать документ</BaseButton>
			</div>
		</div>



		<p v-if="isLoading">Загрузка…</p>
		<p v-else-if="error">{{ error }}</p>

		<EditableTable v-else :columns="columns" :data="documents" row-key="id" :can-edit="false" :sort="sortRules"
			:rowLink="(item) => `/documents/${item.id}`" @sort="onTableSort">
			<template #cell-number="{ item }">
				<span>{{ item.number }}</span>
			</template>
			<template #actions="{ item }">
				<button class="btn" type="button" @click="printDocument(item)">
					Печать
				</button>
			</template>
		</EditableTable>

		<ModalForm v-model="showCancel" title="Подтвердите отмену документа">
			<div>
				<p>Вы действительно хотите отменить документ? Статус документа станет "cancelled".</p>
			</div>
			<template #footer>
				<button class="btn" type="button" @click="showCancel = false">Отмена</button>
				<button class="btn" type="button" style="background:#ff6b6b;color:white"
					@click="performCancel">Отменить</button>
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

/* local header layout fixes for Documents page */
.pageHeader {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 16px;
	flex-wrap: wrap;
}

.leftGroup {
	display: flex;
	align-items: center;
	gap: 12px;
}

.searchWrap {
	flex: 0 1 420px;
	max-width: 520px;
	display: flex;
	align-items: center;
	position: relative;
}

.searchInput {
	width: 260px;
	min-width: 180px;
	height: 40px;
}

.dateRangeWrap {
	position: relative;
}

.dateRangeBtn {
	height: 40px;
	padding: 0 12px;
	border-radius: 10px;
	background: var(--surface);
	border: 1px solid var(--border);
	display: inline-flex;
	align-items: center;
	color: inherit;
}

.datePanel {
	position: absolute;
	right: 0;
	top: 48px;
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: 8px;
	padding: 10px;
	z-index: 40;
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 280px;
}

.dateInputs {
	display: flex;
	gap: 8px;
	align-items: center;
}

.dateActions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}

.actions {
	display: flex;
	align-items: center;
	gap: 8px;
}

/* style date inputs like selects so they align visually */
input.select[type="date"],
select.select,
select,
input.dateInput {
	height: 40px;
	padding: 0 12px;
	border-radius: 10px;
	line-height: 18px;
}

/* ensure date inputs have a similar width to selects */
input.dateInput {
	width: 140px;
	box-sizing: border-box;
}

/* ensure small inputs don't overflow */
.actions .muted {
	display: flex;
	align-items: center;
}

/* header/actions/buttons/select use global styles in src/style.css */
</style>
