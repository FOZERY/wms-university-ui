<script setup lang="ts">
import BaseButton from "./BaseButton.vue";

export type SummaryItem = {
  id: number;
  name: string;
  percent: number;
};

const { items } = defineProps<{ items: SummaryItem[] }>();

function onDetails(id: number) {
  // placeholder: route to warehouse page or open modal
  console.log("details", id);
}
</script>

<template>
  <div class="statsSummary">
    <h4 v-if="items?.length">Сводка по складам</h4>
    <div class="legendRow">
      <div class="legendItem"><span class="dot occupied"></span> Занято</div>
      <div class="legendItem"><span class="dot free"></span> Свободно</div>
    </div>
    <ul class="statsListSmall">
      <li v-for="it in items" :key="it.id" class="statItemSmall">
        <div class="statLeft">
          <div class="statNameSmall">{{ it.name }}</div>
          <div class="statBarSmall">
            <div
              class="statFillSmall"
              :style="{ width: it.percent + '%' }"
              :class="{ warn: it.percent > 80, danger: it.percent > 95 }"
            ></div>
          </div>
        </div>
        <div class="statRight">
          <div class="statPctSmall">{{ it.percent }}%</div>
          <BaseButton type="button" class="detailsBtn" @click="onDetails(it.id)"
            >Детали</BaseButton
          >
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.statsSummary {
  font-size: 13px;
}
.legendRow {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}
.legendItem {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
}
.dot {
  width: 12px;
  height: 8px;
  border-radius: 3px;
  display: inline-block;
}
.dot.occupied {
  background: rgba(99, 132, 255, 0.9);
}
.dot.free {
  background: rgba(160, 160, 160, 0.7);
}
.statsListSmall {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.statItemSmall {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.statLeft {
  flex: 1 1 auto;
}
.statNameSmall {
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.statBarSmall {
  height: 8px;
  background: var(--surface-2);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 6px;
}
.statFillSmall {
  height: 100%;
  background: rgba(99, 132, 255, 0.8);
  transition: width 0.3s ease;
}
.statFillSmall.warn {
  background: orange;
}
.statFillSmall.danger {
  background: tomato;
}
.statRight {
  display: flex;
  align-items: center;
  gap: 8px;
}
.statPctSmall {
  color: var(--muted);
  font-size: 13px;
  min-width: 36px;
  text-align: right;
}
.detailsBtn {
  padding: 6px 8px;
  height: 32px;
}
</style>
