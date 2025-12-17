<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const supplierId = route.params.id as string;

const supplier = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
	// Mock data
	setTimeout(() => {
		supplier.value = {
			id: supplierId,
			name: 'ООО "Поставщик"',
			inn: "7700000000",
			contactPerson: "Иванов Иван Иванович",
			phone: "+7 (999) 000-00-00",
			email: "info@supplier.com",
			address: "г. Москва, ул. Пушкина, д. 10",
			documents: [
				{
					id: 1,
					number: "ПР-0001",
					date: "2025-12-13",
					amount: 50000,
					status: "completed",
				},
				{
					id: 3,
					number: "ПР-0003",
					date: "2025-12-11",
					amount: 12000,
					status: "completed",
				},
			],
		};
		loading.value = false;
	}, 500);
});

const goBack = () => router.back();
</script>

<template>
	<div>
		<div class="pageHeader">
			<div class="headerLeft">
				<button @click="goBack" class="backBtn">← Назад</button>
				<h1>{{ supplier?.name || "Поставщик" }}</h1>
			</div>
		</div>

		<div v-if="loading" class="loading">Загрузка...</div>

		<div v-else-if="supplier" class="content">
			<div class="card infoCard">
				<h3>Контактная информация</h3>
				<div class="infoGrid">
					<div class="infoItem">
						<span class="label">ИНН:</span>
						<span class="value">{{ supplier.inn }}</span>
					</div>
					<div class="infoItem">
						<span class="label">Контактное лицо:</span>
						<span class="value">{{ supplier.contactPerson }}</span>
					</div>
					<div class="infoItem">
						<span class="label">Телефон:</span>
						<span class="value">{{ supplier.phone }}</span>
					</div>
					<div class="infoItem">
						<span class="label">Email:</span>
						<span class="value">{{ supplier.email }}</span>
					</div>
					<div class="infoItem fullWidth">
						<span class="label">Адрес:</span>
						<span class="value">{{ supplier.address }}</span>
					</div>
				</div>
			</div>

			<div class="card">
				<h3>История поставок</h3>
				<table class="table">
					<thead>
						<tr>
							<th>Номер документа</th>
							<th>Дата</th>
							<th>Сумма</th>
							<th>Статус</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="doc in supplier.documents" :key="doc.id">
							<td>
								<router-link
									:to="`/documents/${doc.id}`"
									class="link"
									>{{ doc.number }}</router-link
								>
							</td>
							<td>{{ doc.date }}</td>
							<td>{{ doc.amount.toLocaleString() }} ₽</td>
							<td>{{ doc.status }}</td>
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
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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
