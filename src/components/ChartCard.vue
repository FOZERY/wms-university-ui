<script setup lang="ts">
import { ref } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const props = defineProps<{
  title?: string;
  chartData: any;
  chartOptions?: any;
  summaryItems?: Array<any>;
}>();

const chartContainerRef = ref<HTMLElement | null>(null);

function getCanvas(): HTMLCanvasElement | null {
  return chartContainerRef.value
    ? (chartContainerRef.value.querySelector("canvas") as HTMLCanvasElement)
    : null;
}

defineExpose({ getCanvas });
</script>

<template>
  <div class="chartCardWrapper card">
    <div class="chartHeader">
      <div class="title">{{ title }}</div>
    </div>

    <div class="chartBody">
      <div class="chartPane">
        <div class="chartContainerSmall" ref="chartContainerRef">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <aside v-if="$slots.summary" class="summaryPane">
        <slot name="summary" />
      </aside>
    </div>

    <div class="controlsSpacer">
      <div class="cardControls">
        <slot name="controls" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chartCardWrapper {
  padding: 12px;
  /* allow dropdowns to overflow the card bounds */
  overflow: visible;
}
.chartHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.chartHeader .title {
  font-weight: 700;
  font-size: 16px;
}
.chartBody {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.chartPane {
  flex: 1 1 auto;
  min-width: 0;
}
.controlsSpacer {
  margin-top: 12px;
}
.chartContainerSmall {
  height: 320px;
  width: 100%;
}
.chartContainerSmall canvas {
  width: 100% !important;
  height: 320px !important;
  display: block;
}
.cardControls {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.summaryPane {
  flex: 0 0 240px;
  min-width: 240px;
}
</style>
