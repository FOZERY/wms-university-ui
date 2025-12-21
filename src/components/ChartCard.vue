<script setup lang="ts">
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";
import { ref } from "vue";
import { Bar, Line } from "vue-chartjs";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement
);

const props = defineProps<{
  title?: string;
  chartData: any;
  chartOptions?: any;
  summaryItems?: Array<any>;
  type?: "bar" | "line";
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
          <Line v-if="type === 'line'" :data="chartData" :options="chartOptions" />
          <Bar v-else :data="chartData" :options="chartOptions" />
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
  box-sizing: border-box;
  padding: calc(10px * var(--chart-card-scale, 1));
  /* allow dropdowns to overflow the card bounds */
  overflow: visible;

  /* sizing variables (override from parent or page if needed) */
  --chart-card-chart-height: 240px;
  --chart-card-scale: 1;

  width: 100%;

  /* base font-size that children can inherit and scale */
  font-size: calc(13px * var(--chart-card-scale));

  /* flex layout to push controls to bottom */
  display: flex;
  flex-direction: column;
}

.chartHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: calc(10px * var(--chart-card-scale));
  margin-bottom: calc(8px * var(--chart-card-scale));
}

.chartHeader .title {
  font-weight: 700;
  font-size: calc(15px * var(--chart-card-scale));
}

.chartBody {
  display: flex;
  gap: calc(10px * var(--chart-card-scale));
  align-items: flex-start;
  flex: 0 0 auto;
  /* don't grow — let controlsSpacer take remaining space */
}

.chartPane {
  flex: 1 1 auto;
  min-width: 0;
}

.controlsSpacer {
  flex: 1 1 auto;
  /* grow to fill remaining space */
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  /* push controls to the very bottom */
  padding-top: calc(10px * var(--chart-card-scale));
}

.chartContainerSmall {
  height: var(--chart-card-chart-height);
  width: 100%;
}

.chartContainerSmall canvas {
  width: 100% !important;
  height: var(--chart-card-chart-height) !important;
  display: block;
}

.cardControls {
  margin-top: calc(8px * var(--chart-card-scale));
  display: flex;
  gap: calc(8px * var(--chart-card-scale));
  flex-wrap: wrap;
}

/* .cardControls > * removed to avoid messing up wrapper divs like exportWrapper */
.summaryPane {
  flex: 0 0 calc(170px * var(--chart-card-scale));
  min-width: calc(170px * var(--chart-card-scale));
  /* фиксированная высота чтобы карточки были одной высоты */
  height: var(--chart-card-chart-height);
  /* let inner content control scrolling (avoid double scrollbar on the card) */
  overflow: visible;
  padding-right: 0;
}

/* Responsive tweaks and scale adjustments */
@media (max-width: 800px) {
  .chartCardWrapper {
    --chart-card-chart-height: 220px;
    --chart-card-scale: 0.95;
  }

  .summaryPane {
    flex: 0 0 calc(150px * var(--chart-card-scale));
    min-width: calc(150px * var(--chart-card-scale));
  }
}

@media (max-width: 640px) {

  /* stack summary under the chart on small screens and reduce height */
  .chartBody {
    flex-direction: column;
    gap: calc(10px * var(--chart-card-scale));
  }

  .summaryPane {
    flex: 0 0 auto;
    min-width: 0;
    width: 100%;
  }

  .chartCardWrapper {
    --chart-card-max-width: 100%;
    --chart-card-chart-height: 220px;
    --chart-card-scale: 0.92;
  }
}
</style>
