<script setup lang="ts">
import { onMounted, ref } from "vue";

const activeTab = ref("low-stock");
const loading = ref(false);
const lowStockItems = ref<any[]>([]);
const movements = ref<any[]>([]);

onMounted(() => {
	loadData();
});

const loadData = () => {
	// Populate mock reports synchronously (no artificial delay)
	loading.value = true;
	// Mock Low Stock
	lowStockItems.value = [
		{
			id: 1,
			name: "Гвозди",
			minQuantity: 100,
			currentQuantity: 50,
			warehouse: "Основной склад",
		},
		{
			id: 3,
			name: "Краска",
			minQuantity: 20,
			currentQuantity: 5,
			warehouse: "Цех №1",
		},
	];

	// Mock Movements
	movements.value = [
		{
			id: 1,
			date: "2025-12-13",
			item: "Гвозди",
			type: "incoming",
			quantity: 500,
			warehouse: "Основной склад",
		},
		{
			id: 2,
			date: "2025-12-12",
			item: "Доски",
			type: "transfer",
			quantity: 100,
			warehouse: "Основной склад -> Цех №1",
		},
		{
			id: 3,
			date: "2025-12-11",
			item: "Краска",
			type: "production",
			quantity: -10,
			warehouse: "Цех №1",
		},
	];
	loading.value = false;
};
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Отчеты</h1>
		</div>

		<div class="tabs">
			<button
				class="tabBtn"
				:class="{ active: activeTab === 'low-stock' }"
				@click="activeTab = 'low-stock'"
			>
				Заканчивающиеся товары
			</button>
			<button
				class="tabBtn"
				:class="{ active: activeTab === 'movement' }"
				@click="activeTab = 'movement'"
			>
				Движение товаров
			</button>
		</div>

		<div v-if="loading" class="loading">Загрузка...</div>

		<div v-else class="content">
			<!-- Low Stock Report -->
			<div v-if="activeTab === 'low-stock'" class="card">
				<h3>Товары ниже минимального остатка</h3>
				<p class="muted">
					Список товаров, количество которых упало ниже установленного
					минимума.
				</p>

				<table class="table">
					<thead>
						<tr>
							<th>Номенклатура</th>
							<th>Склад</th>
							<th>Текущий остаток</th>
							<th>Мин. остаток</th>
							<th>Дефицит</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="item in lowStockItems" :key="item.id">
							<td>
								<router-link
									:to="`/items/${item.id}`"
									class="link"
									>{{ item.name }}</router-link
								>
							</td>
							<td>{{ item.warehouse }}</td>
							<td class="danger">{{ item.currentQuantity }}</td>
							<td>{{ item.minQuantity }}</td>
							<td class="danger">
								{{ item.minQuantity - item.currentQuantity }}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<!-- Movement Report -->
			<div v-if="activeTab === 'movement'" class="card">
				<h3>История движения товаров</h3>
				<p class="muted">Последние операции по всем складам.</p>

				<table class="table">
					<thead>
						<tr>
							<th>Дата</th>
							<th>Товар</th>
							<th>Тип операции</th>
							<th>Склад / Направление</th>
							<th>Количество</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="mov in movements" :key="mov.id">
							<td>{{ mov.date }}</td>
							<td>{{ mov.item }}</td>
							<td>{{ mov.type }}</td>
							<td>{{ mov.warehouse }}</td>
							<td
								:class="
									mov.quantity > 0 ? 'positive' : 'negative'
								"
							>
								{{ mov.quantity > 0 ? "+" : ""
								}}{{ mov.quantity }}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<style scoped>
.pageHeader {
	margin-bottom: var(--space-4);
}

.tabs {
	display: flex;
	gap: var(--space-2);
	margin-bottom: var(--space-4);
	border-bottom: 1px solid var(--border);
}

.tabBtn {
	background: none;
	border: none;
	padding: var(--space-2) var(--space-4);
	cursor: pointer;
	font-size: 1rem;
	color: var(--muted);
	border-bottom: 2px solid transparent;
}

.tabBtn.active {
	color: var(--text);
	border-bottom-color: #646cff;
	font-weight: 500;
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

.danger {
	color: #f87171;
	font-weight: 500;
}
.positive {
	color: #34d399;
}
.negative {
	color: #f87171;
}
</style>
