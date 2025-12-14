<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { getPermissions } from "../shared/auth/permissions";
import { mockDocuments } from "../shared/mocks/data";

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

type DocumentFilter = "all" | "incoming" | "movement";
const documentFilter = ref<DocumentFilter>("all");

type DocRow = (typeof mockDocuments)[number];

function mapDocumentTypeToRu(type: string): string {
	if (type === "incoming") return "Приходная накладная";
	if (type === "transfer") return "Документ движения";
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
	// give browser a moment to render before printing
	setTimeout(() => {
		try {
			w.focus();
			w.print();
		} catch (e) {
			// ignore
		}
	}, 100);
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
						<option value="incoming">Приходные накладные</option>
						<option value="movement">
							Документы движения по складам
						</option>
					</select>
				</label>
				<button class="btn btnPrimary" type="button">
					Создать (mock)
				</button>
			</div>
		</div>

		<p class="muted">
			Ролевка: <code>storeKeeper</code> видит только свои документы,
			<code>manager</code> — все.
		</p>

		<table class="table">
			<thead>
				<tr>
					<th>ID</th>
					<th>Номер</th>
					<th>Тип</th>
					<th>Статус</th>
					<th>Дата</th>
					<th>Автор</th>
					<th>Печать</th>
					<th v-if="permissions.canCancelDocuments">Действия</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="d in visibleDocs" :key="d.id">
					<td>{{ d.id }}</td>
					<td>{{ d.number }}</td>
					<td>{{ mapDocumentTypeToRu(d.type) }}</td>
					<td>{{ d.status }}</td>
					<td>{{ d.date }}</td>
					<td>{{ d.authorLogin }}</td>
					<td>
						<button
							class="btn"
							type="button"
							@click="printDocument(d)"
						>
							Печать
						</button>
					</td>
					<td v-if="permissions.canCancelDocuments">
						<button class="btn btnDanger" type="button">
							Отменить
						</button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
