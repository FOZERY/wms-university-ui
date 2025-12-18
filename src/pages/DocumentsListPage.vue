<script setup lang="ts">
import { computed, ref } from "vue";
import BaseButton from "../components/BaseButton.vue";
import EditableTable from "../components/EditableTable.vue";
import { getPermissions } from "../shared/auth/permissions";
import { mockDocuments } from "../shared/mocks/data";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

type DocumentFilter = "all" | "incoming" | "movement";
const documentFilter = ref<DocumentFilter>("all");

type DocRow = (typeof mockDocuments)[number];

function mapDocumentTypeToRu(type: string): string {
	if (type === "incoming") return "Приходный ордер";
	if (type === "transfer") return "Перемещение";
	if (type === "production") return "Производство";
	return type;
}

function printDocument(d: DocRow) {
	const w = window.open(
		"",
		"_blank",
		"noopener,noreferrer,width=800,height=600"
	);
	if (!w) return;

	const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Печать ${
		d.number
	}</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:20px}h1{font-size:18px;margin:0 0 12px}table{border-collapse:collapse;width:100%}td{padding:8px 0;border-bottom:1px solid #ddd}td:first-child{width:220px;color:#555}</style></head><body><h1>${
		d.number
	}</h1><table><tr><td>Тип</td><td>${mapDocumentTypeToRu(
		d.type
	)}</td></tr><tr><td>Статус</td><td>${
		d.status
	}</td></tr><tr><td>Дата</td><td>${d.date}</td></tr><tr><td>Автор</td><td>${
		d.authorLogin
	}</td></tr></table></body></html>`;

	w.document.open();
	w.document.write(html);
	w.document.close();
	// Print immediately (removed artificial delay)
	try {
		w.focus();
		w.print();
	} catch (e) {
		// ignore
	}
}

const visibleDocs = computed(() => {
	if (!auth.me) return [];
	const byRole =
		auth.me.role === "manager"
			? mockDocuments
			: mockDocuments.filter((d) => d.authorRole === "storeKeeper");

	if (documentFilter.value === "all") return byRole;
	if (documentFilter.value === "incoming")
		return byRole.filter((d) => d.type === "incoming");
	// "movement" — все документы движения по складам (transfer + production)
	return byRole.filter((d) => d.type !== "incoming");
});

const columns = computed(() => [
	{ key: "id" as keyof DocRow, label: "ID", width: "60px" },
	{ key: "number" as keyof DocRow, label: "Номер" },
	{
		key: "type" as keyof DocRow,
		label: "Тип",
		format: mapDocumentTypeToRu,
	},
	{ key: "status" as keyof DocRow, label: "Статус" },
	{ key: "date" as keyof DocRow, label: "Дата" },
	{ key: "authorLogin" as keyof DocRow, label: "Автор" },
]);
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Документы</h1>
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
				<BaseButton
					variant="primary"
					@click="$router.push('/documents/new')"
					>Создать (mock)</BaseButton
				>
			</div>
		</div>

		<p class="muted">
			Ролевка: <code>Заведующий склада</code> видит только свои документы,
			<code>Менеджер</code> — все.
		</p>

		<EditableTable
			:columns="columns"
			:data="visibleDocs"
			row-key="id"
			:can-edit="false"
		>
			<template #cell-number="{ item }">
				<router-link :to="`/documents/${item.id}`" class="link">{{
					item.number
				}}</router-link>
			</template>
			<template #actions="{ item }">
				<button class="btn" type="button" @click="printDocument(item)">
					Печать
				</button>
			</template>
		</EditableTable>
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
.pageHeader {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: var(--space-4);
}
.actions {
	display: flex;
	gap: var(--space-3);
	align-items: center;
}
.select {
	padding: 6px;
	border-radius: 4px;
	border: 1px solid var(--border);
	background: var(--surface);
	color: var(--text);
}
.btn {
	padding: 4px 8px;
	border: 1px solid var(--border);
	background: var(--surface);
	border-radius: 4px;
	cursor: pointer;
	color: var(--text);
}
.btn:hover {
	background: var(--surface-2);
}
</style>
