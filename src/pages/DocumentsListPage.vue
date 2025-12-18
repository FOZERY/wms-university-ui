<script setup lang="ts">
import { computed, ref } from "vue";
import useDebounce from "../composables/useDebounce";
import BaseButton from "../components/BaseButton.vue";
import EditableTable from "../components/EditableTable.vue";
import { mockDocuments } from "../shared/mocks/data";
import ModalForm from "../components/ModalForm.vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

type DocumentFilter = "all" | "incoming" | "movement";
const documentFilter = ref<DocumentFilter>("all");
const searchQuery = ref("");
const debouncedSearch = useDebounce(searchQuery, 250);

type DocRow = (typeof mockDocuments)[number];

function mapDocumentTypeToRu(type: string): string {
	if (type === "incoming") return "Приходный ордер";
	if (type === "transfer") return "Перемещение";
	if (type === "production") return "Производство";
	return type;
}

function printDocument(d: DocRow) {
	const w = window.open("", "_blank", "noopener,noreferrer,width=800,height=600");
	if (!w) return;

	const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Печать ${d.number}</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:20px}h1{font-size:18px;margin:0 0 12px}table{border-collapse:collapse;width:100%}td{padding:8px 0;border-bottom:1px solid #ddd}td:first-child{width:220px;color:#555}</style></head><body><h1>${d.number}</h1><table><tr><td>Тип</td><td>${mapDocumentTypeToRu(d.type)}</td></tr><tr><td>Статус</td><td>${d.status}</td></tr><tr><td>Дата</td><td>${d.date}</td></tr><tr><td>Автор</td><td>${d.authorLogin}</td></tr></table></body></html>`;

	w.document.open();
	w.document.write(html);
	w.document.close();
	try {
		w.focus();
		w.print();
	} catch (e) {
		// ignore
	}
}

// cancel flow (detail page handles confirmation; keep a simple performCancel helper for reuse)
const showCancel = ref(false);
const cancelTarget = ref<number | null>(null);

function performCancel() {
	if (cancelTarget.value == null) return;
	const idx = mockDocuments.findIndex((d) => d.id === cancelTarget.value);
	if (idx !== -1) {
		const doc = mockDocuments[idx];
		if (doc) doc.status = "cancelled";
	}
	showCancel.value = false;
	cancelTarget.value = null;
}

function clearSearch() {
	searchQuery.value = "";
	try {
		debouncedSearch.value = "";
	} catch (e) {
		/* noop */
	}
}

const visibleDocs = computed(() => {
	if (!auth.me) return mockDocuments;
	const byRole = auth.me.role === "manager" ? mockDocuments : mockDocuments.filter((d) => d.authorRole === "storeKeeper");

	if (documentFilter.value === "all") return byRole;
	if (documentFilter.value === "incoming") return byRole.filter((d) => d.type === "incoming");
	return byRole.filter((d) => d.type !== "incoming");
});

const displayedDocs = computed(() => {
	const q = debouncedSearch.value.trim().toLowerCase();
	if (!q) return visibleDocs.value;
	return visibleDocs.value.filter((d) => {
		return (
			String(d.number).toLowerCase().includes(q) ||
			String(d.authorLogin || "").toLowerCase().includes(q) ||
			String(d.type || "").toLowerCase().includes(q)
		);
	});
});

const columns = computed(() => [
	{ key: "id" as keyof DocRow, label: "ID", width: "60px" },
	{ key: "number" as keyof DocRow, label: "Номер" },
	{ key: "type" as keyof DocRow, label: "Тип", format: mapDocumentTypeToRu },
	{ key: "status" as keyof DocRow, label: "Статус" },
	{ key: "date" as keyof DocRow, label: "Дата" },
	{ key: "authorLogin" as keyof DocRow, label: "Автор" },
]);
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Документы</h1>
			<div class="searchWrap">
				<input v-model="searchQuery" class="searchInput" placeholder="Поиск по номеру..." />
				<button v-if="searchQuery" class="clearButton" type="button" @click="clearSearch">×</button>
			</div>
			<div class="actions">
				<label class="muted">
					Фильтр:&nbsp;
					<select v-model="documentFilter" class="select">
						<option value="all">Все</option>
						<option value="incoming">Приходные ордера</option>
						<option value="movement">
							Документы движения по складам
						</option>
					</select>
				</label>
				<BaseButton variant="primary" @click="$router.push('/documents/new')">Создать документ</BaseButton>
			</div>
		</div>



		<EditableTable :columns="columns" :data="displayedDocs" row-key="id" :can-edit="false"
			:rowLink="(item) => `/documents/${item.id}`">
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

/* header/actions/buttons/select use global styles in src/style.css */
</style>
