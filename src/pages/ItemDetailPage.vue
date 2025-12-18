<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const itemId = route.params.id as string;

const item = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
	// Mock data assigned synchronously (no artificial delay)
	item.value = {
		id: itemId,
		code: "ART-001",
		name: "Гвозди строительные",
		unit: "кг",
		type: "material",
		minQuantity: 100,
		description: "Обычные гвозди для строительства",
		totalQuantity: 1250,
		balances: [
			{
				warehouseId: 1,
				warehouseName: "Основной склад",
				quantity: 1000,
				reserved: 50,
				available: 950,
			},
			{
				warehouseId: 2,
				warehouseName: "Цех №1",
				quantity: 250,
				reserved: 0,
				available: 250,
			},
		],
		history: [
			{
				id: 1,
				date: "2025-12-13",
				type: "incoming",
				documentNumber: "ПР-0001",
				quantity: 500,
				warehouse: "Основной склад",
			},
			{
				id: 2,
				date: "2025-12-10",
				type: "transfer",
				documentNumber: "РМ-0005",
				quantity: -200,
				warehouse: "Основной склад",
			},
		],
	};
	loading.value = false;
});

const goBack = () => router.back();
</script>

<template>
	<div>
		<div class="pageHeader">
			<div class="headerLeft">
				<button @click="goBack" class="backBtn">← Назад</button>
				<h1>{{ item?.name || "Номенклатура" }}</h1>
			</div>
		</div>

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
						<span class="value">{{ item.type }}</span>
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
							<tr
								v-for="balance in item.balances"
								:key="balance.warehouseId"
							>
								<td>
									<router-link
										:to="`/warehouses/${balance.warehouseId}`"
										class="link"
										>{{
											balance.warehouseName
										}}</router-link
									>
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
							<tr v-for="rec in item.history" :key="rec.id">
								<td>{{ rec.date }}</td>
								<td>
									<router-link
										:to="`/documents/${rec.id}`"
										class="link"
										>{{ rec.documentNumber }}</router-link
									>
								</td>
								<td>{{ rec.type }}</td>
								<td
									:class="
										rec.quantity > 0
											? 'positive'
											: 'negative'
									"
								>
									{{ rec.quantity > 0 ? "+" : ""
									}}{{ rec.quantity }}
								</td>
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
