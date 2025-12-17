<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const warehouseId = route.params.id as string;

const warehouse = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
	// Mock data
	setTimeout(() => {
		warehouse.value = {
			id: warehouseId,
			name: "Основной склад",
			address: "ул. Ленина, 1",
			stats: {
				totalItems: 150,
				totalValue: 1500000,
				capacity: 80,
			},
			stock: [
				{
					id: 1,
					name: "Гвозди",
					quantity: 500,
					reserved: 50,
					available: 450,
					unit: "кг",
				},
				{
					id: 2,
					name: "Доски",
					quantity: 100,
					reserved: 0,
					available: 100,
					unit: "шт",
				},
			],
			recentDocuments: [
				{
					id: 1,
					number: "ПР-0001",
					type: "incoming",
					date: "2025-12-13",
					status: "completed",
				},
				{
					id: 2,
					number: "РМ-0005",
					type: "transfer",
					date: "2025-12-10",
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
				<h1>{{ warehouse?.name || "Склад" }}</h1>
			</div>
		</div>

		<div v-if="loading" class="loading">Загрузка...</div>

		<div v-else-if="warehouse" class="content">
			<div class="statsGrid">
				<div class="statCard">
					<div class="statLabel">Всего позиций</div>
					<div class="statValue">
						{{ warehouse.stats.totalItems }}
					</div>
				</div>
				<div class="statCard">
					<div class="statLabel">Общая стоимость</div>
					<div class="statValue">
						{{ warehouse.stats.totalValue.toLocaleString() }} ₽
					</div>
				</div>
				<div class="statCard">
					<div class="statLabel">Загруженность</div>
					<div class="statValue">{{ warehouse.stats.capacity }}%</div>
				</div>
			</div>

			<div class="grid2col">
				<div class="card">
					<h3>Остатки на складе</h3>
					<table class="table">
						<thead>
							<tr>
								<th>Номенклатура</th>
								<th>Всего</th>
								<th>Резерв</th>
								<th>Доступно</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="item in warehouse.stock" :key="item.id">
								<td>
									<router-link
										:to="`/items/${item.id}`"
										class="link"
										>{{ item.name }}</router-link
									>
								</td>
								<td>{{ item.quantity }} {{ item.unit }}</td>
								<td>{{ item.reserved }} {{ item.unit }}</td>
								<td>{{ item.available }} {{ item.unit }}</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="card">
					<h3>Последние документы</h3>
					<table class="table">
						<thead>
							<tr>
								<th>Номер</th>
								<th>Тип</th>
								<th>Дата</th>
								<th>Статус</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="doc in warehouse.recentDocuments"
								:key="doc.id"
							>
								<td>
									<router-link
										:to="`/documents/${doc.id}`"
										class="link"
										>{{ doc.number }}</router-link
									>
								</td>
								<td>{{ doc.type }}</td>
								<td>{{ doc.date }}</td>
								<td>{{ doc.status }}</td>
							</tr>
						</tbody>
					</table>
				</div>
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

.statsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: var(--space-3);
}

.statCard {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: var(--space-3);
}

.statLabel {
	color: var(--muted);
	font-size: 0.9rem;
}

.statValue {
	font-size: 1.5rem;
	font-weight: 600;
	margin-top: 4px;
}

.grid2col {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--space-4);
}

.card {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: var(--space-4);
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
