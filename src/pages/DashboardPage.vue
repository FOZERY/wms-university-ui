<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import BaseButton from "../components/BaseButton.vue";
import ChartCard from "../components/ChartCard.vue";
import StatsSummary from "../components/StatsSummary.vue";
import { useWarehouseStats } from "../composables/useWarehouseStats";

const { data } = useWarehouseStats();
const router = useRouter();

const chartCardRef = ref<any>(null);

function goToDocuments() {
	router.push("/documents");
}

function goToNomenclature() {
	router.push("/nomenclature");
}
const exportMenuOpen = ref(false);
const exportMenuAbove = ref(false);
const exportWrapperRef = ref<HTMLElement | null>(null);
const exportMenuRef = ref<HTMLElement | null>(null);

async function toggleExportMenu() {
	exportMenuOpen.value = !exportMenuOpen.value;
	if (exportMenuOpen.value) {
		await nextTick();
		const wrapper = exportWrapperRef.value;
		const menu = exportMenuRef.value;
		if (!wrapper || !menu) return;
		const wrapRect = wrapper.getBoundingClientRect();
		const menuRect = menu.getBoundingClientRect();
		// If menu would overflow viewport bottom, show it above the button
		exportMenuAbove.value =
			wrapRect.bottom + menuRect.height > window.innerHeight - 8;
	} else {
		exportMenuAbove.value = false;
	}
}

function closeExportMenu() {
	exportMenuOpen.value = false;
}

function handleOutsideClick(e: MouseEvent) {
	const el = chartCardRef.value?.$el as HTMLElement | undefined;
	const wrap = exportWrapperRef.value;
	if (wrap && wrap.contains(e.target as Node)) return; // click inside wrapper
	if (!el) return;
	if (!el.contains(e.target as Node)) closeExportMenu();
}

onMounted(() => document.addEventListener("click", handleOutsideClick));
onBeforeUnmount(() =>
	document.removeEventListener("click", handleOutsideClick),
);

const chartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: { display: false },
		title: { display: false },
		tooltip: {
			enabled: true,
			callbacks: {
				title: (items: any) => {
					// Показываем полное название склада в tooltip
					if (items && items.length > 0) {
						return items[0].label;
					}
					return "";
				},
			},
		},
	},
	scales: {
		x: {
			stacked: true,
			ticks: {
				display: true,
				font: { size: 8 },
				maxRotation: 0,
				minRotation: 0,
				callback: function (this: any, value: any) {
					// Сокращаем длинные подписи, но показываем tooltip
					const label = (this.getLabelForValue ? this.getLabelForValue(value) : value) as any;
					if (typeof label === "string" && label.length > 10) {
						return label.slice(0, 10) + "…";
					}
					return label;
				},
			},
			grid: { display: false },
		},
		y: { stacked: true, beginAtZero: true },
	},
};

// --- Mock data for additional dashboard charts ---
function genLabels(days = 14) {
	const res: string[] = [];
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		res.push(d.toISOString().slice(5, 10));
	}
	return res;
}

const dailyChartData = computed(() => {
	const labels = genLabels(14);
	return {
		labels,
		datasets: [
			{
				label: "Приход",
				backgroundColor: "rgba(75,192,192,0.3)",
				borderColor: "rgba(75,192,192,1)",
				borderWidth: 2,
				fill: true,
				tension: 0.4,
				data: labels.map(() => Math.floor(Math.random() * 20) + 5)
			},
			{
				label: "Перемещение",
				backgroundColor: "rgba(255,159,64,0.3)",
				borderColor: "rgba(255,159,64,1)",
				borderWidth: 2,
				fill: true,
				tension: 0.4,
				data: labels.map(() => Math.floor(Math.random() * 10) + 2)
			},
			{
				label: "Производство",
				backgroundColor: "rgba(153,102,255,0.3)",
				borderColor: "rgba(153,102,255,1)",
				borderWidth: 2,
				fill: true,
				tension: 0.4,
				data: labels.map(() => Math.floor(Math.random() * 8))
			},
		],
	};
});

// Mock data: товары ниже минимального остатка
const lowStockItems = [
	{ id: 1, name: "Болт М8", current: 12, min: 50 },
	{ id: 2, name: "Гайка М10", current: 8, min: 30 },
	{ id: 3, name: "Шайба плоская", current: 5, min: 20 },
	{ id: 4, name: "Клей ПВА", current: 2, min: 10 },
];

const lowStockChartData = computed(() => {
	return {
		labels: lowStockItems.map(i => i.name),
		datasets: [
			{ label: "Текущий остаток", backgroundColor: "rgba(255,99,132,0.8)", data: lowStockItems.map(i => i.current) },
			{ label: "Минимум", backgroundColor: "rgba(200,200,200,0.5)", data: lowStockItems.map(i => i.min) },
		],
	};
});

// summary items derived from lowStockItems (kept for future use)
// (removed as a separate computed to avoid unused-variable build error)

// Легенда для документов
const docLegend = [
	{ label: "Приход", color: "rgba(75,192,192,1)" },
	{ label: "Перемещение", color: "rgba(255,159,64,1)" },
	{ label: "Производство", color: "rgba(153,102,255,1)" },
];

const chartData = computed(() => {
	const slice = data.value.slice(0, 2);
	return {
		labels: slice.map((w: any) => w.name),
		datasets: [
			{
				label: "Занято",
				backgroundColor: "rgba(99, 132, 255, 0.9)",
				data: slice.map((w: any) => w.currentCount),
			},
			{
				label: "Свободно",
				backgroundColor: "rgba(160, 160, 160, 0.6)",
				data: slice.map((w: any) => w.capacity - w.currentCount),
			},
		],
	};
});

const utilization = computed(() =>
	data.value.slice(0, 2).map((w: any) => ({
		...w,
		percent: Math.round((w.currentCount / w.capacity) * 100),
	})),
);

function exportCSV() {
	const rows = [["id", "name", "capacity", "currentCount", "percent"]];
	utilization.value.forEach((w: any) =>
		rows.push([
			w.id,
			w.name,
			String(w.capacity),
			String(w.currentCount),
			String(w.percent),
		]),
	);
	const csv = rows
		.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
		.join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "warehouse_stats.csv";
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

async function exportPNG() {
	const card = chartCardRef.value;
	if (!card || !card.getCanvas) return;
	const canvas = card.getCanvas();
	if (!canvas) return;
	return new Promise<void>((resolve) => {
		canvas.toBlob((blob: Blob | null) => {
			if (!blob) return resolve();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "chart.png";
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
			resolve();
		});
	});
}

async function exportXLSX() {
	const rows: any[] = [["id", "name", "capacity", "currentCount", "percent"]];
	utilization.value.forEach((w: any) =>
		rows.push([w.id, w.name, w.capacity, w.currentCount, w.percent]),
	);
	try {
		const XLSX = (await import("xlsx")) as any;
		const ws = XLSX.utils.aoa_to_sheet(rows);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
		const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
		const blob = new Blob([wbout], { type: "application/octet-stream" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "warehouse_stats.xlsx";
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	} catch (e) {
		// If xlsx is not available, fall back to CSV
		exportCSV();
	}
}
</script>

<template>
	<div>
		<div class="pageHeader">
			<div class="headerLeft">
				<h2 class="muted">Обзор</h2>
			</div>
		</div>

		<div class="chartsGrid">
			<!-- 1. Загруженность складов -->
			<ChartCard ref="chartCardRef" :chartData="chartData" :chartOptions="chartOptions" title="Загруженность складов"
				:style="{ '--chart-card-chart-height': '180px' }">
				<template #summary>
					<StatsSummary :items="utilization" />
				</template>
				<template #controls>
					<div class="exportWrapper" ref="exportWrapperRef">
						<BaseButton variant="default" @click="toggleExportMenu">
							Экспортировать
							<svg style="margin-left: 8px" width="12" height="12" viewBox="0 0 24 24" fill="none"
								xmlns="http://www.w3.org/2000/svg">
								<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
									stroke-linejoin="round" />
							</svg>
						</BaseButton>
						<div v-if="exportMenuOpen" :class="['exportMenu', { above: exportMenuAbove }]" ref="exportMenuRef">
							<button class="menuItem" @click.prevent="exportCSV">CSV</button>
							<button class="menuItem" @click.prevent="exportPNG">PNG</button>
							<button class="menuItem" @click.prevent="exportXLSX">XLSX</button>
						</div>
					</div>
				</template>
			</ChartCard>

			<!-- 2. Документы за 14 дней -->
			<ChartCard type="line" :chartData="dailyChartData"
				:chartOptions="{ ...chartOptions, scales: { x: { stacked: false, grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(128,128,128,0.1)' } } } }"
				title="Документы — 14 дней" :style="{ '--chart-card-chart-height': '180px' }">
				<template #summary>
					<div class="legendOnly">
						<h4>Легенда</h4>
						<div class="legendList">
							<div class="legendItem" v-for="item in docLegend" :key="item.label">
								<span class="dot" :style="{ background: item.color }"></span>
								{{ item.label }}
							</div>
						</div>
					</div>
				</template>
				<template #controls>
					<BaseButton variant="default" @click="goToDocuments">Открыть список</BaseButton>
				</template>
			</ChartCard>

			<!-- 3. Товары ниже минимума -->
			<ChartCard :chartData="lowStockChartData"
				:chartOptions="{ ...chartOptions, indexAxis: 'y', scales: { x: { beginAtZero: true }, y: { ticks: { font: { size: 10 } } } } }"
				title="Товары ниже минимума" :style="{ '--chart-card-chart-height': '180px' }">
				<template #summary>
					<div class="legendOnly">
						<h4>Легенда</h4>
						<div class="legendList">
							<div class="legendItem"><span class="dot" style="background: rgba(255,99,132,0.8)"></span> Текущий остаток
							</div>
							<div class="legendItem"><span class="dot" style="background: rgba(200,200,200,0.5)"></span> Минимум</div>
						</div>
						<p class="lowStockHint">{{ lowStockItems.length }} позиций требуют пополнения</p>
					</div>
				</template>
				<template #controls>
					<BaseButton variant="default" @click="goToNomenclature">Открыть номенклатуру</BaseButton>
				</template>
			</ChartCard>
		</div>
	</div>
</template>

<style scoped>
.chartsGrid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 12px;
	width: 100%;
	align-items: stretch;
}

@media (max-width: 1000px) {
	.chartsGrid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 700px) {
	.chartsGrid {
		grid-template-columns: 1fr;
	}
}

.exportArea {
	margin-top: 12px;
	display: flex;
}

.exportWrapper {
	position: relative;
}

.exportMenu {
	position: absolute;
	top: calc(100% + 3px);
	left: 0;
	background: var(--surface);
	border: 1px solid var(--border);
	padding: 6px;
	border-radius: 8px;
	box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
	z-index: 60;
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 100%;
}

.exportMenu .menuItem {
	background: transparent;
	border: none;
	padding: 6px 12px;
	text-align: left;
	cursor: pointer;
	border-radius: 6px;
}

.exportMenu .menuItem:hover {
	background: var(--surface-2);
}

.exportMenu.above {
	top: auto;
	bottom: calc(100% + 3px);
}

/* Legend-only summary for charts */
.legendOnly {
	font-size: 12px;
}

.legendOnly h4 {
	margin: 0 0 8px 0;
	font-size: 13px;
	font-weight: 600;
}

.legendList {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.legendItem {
	display: flex;
	align-items: center;
	gap: 6px;
	color: var(--muted);
}

.dot {
	width: 12px;
	height: 8px;
	border-radius: 3px;
	display: inline-block;
	flex-shrink: 0;
}

.lowStockHint {
	margin: 10px 0 0 0;
	font-size: 11px;
	color: rgba(255, 99, 132, 0.9);
	font-weight: 500;
}
</style>
