<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import ChartCard from "../components/ChartCard.vue";
import StatsSummary from "../components/StatsSummary.vue";
import { useWarehouseStats } from "../composables/useWarehouseStats";
import BaseButton from "../components/BaseButton.vue";

const { data } = useWarehouseStats();

const chartCardRef = ref<any>(null);
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
  document.removeEventListener("click", handleOutsideClick)
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: false },
  },
  scales: {
    x: {
      stacked: true,
      ticks: {
        display: true,
        font: { size: 8 },
        maxRotation: 0,
        minRotation: 0,
      },
      grid: { display: false },
    },
    y: { stacked: true, beginAtZero: true },
  },
};

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
  }))
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
    ])
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
    rows.push([w.id, w.name, w.capacity, w.currentCount, w.percent])
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
      <ChartCard
        ref="chartCardRef"
        :chartData="chartData"
        :chartOptions="chartOptions"
        title="Загруженность складов"
      >
        <template #summary>
          <StatsSummary :items="utilization" />
        </template>
        <template #controls>
          <div class="exportWrapper" ref="exportWrapperRef">
            <BaseButton variant="default" @click="toggleExportMenu">
              Экспортировать
              <svg
                style="margin-left: 8px"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </BaseButton>
            <div
              v-if="exportMenuOpen"
              :class="['exportMenu', { above: exportMenuAbove }]"
              ref="exportMenuRef"
            >
              <button class="menuItem" @click.prevent="exportCSV">CSV</button>
              <button class="menuItem" @click.prevent="exportPNG">PNG</button>
              <button class="menuItem" @click.prevent="exportXLSX">XLSX</button>
            </div>
          </div>
        </template>
      </ChartCard>
    </div>
  </div>
</template>

<style scoped>
.chartsGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  max-width: 500px;
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
</style>
