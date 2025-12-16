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
              :class="{
                warn: it.percent >= 80 && it.percent < 90,
                danger: it.percent >= 90,
              }"
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
  font-size: 12px;
}
.legendRow {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}
.legendItem {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--muted);
  font-size: 11px;
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
  gap: 6px;
}
.statItemSmall {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.statLeft {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}
.statNameSmall {
  font-weight: 500;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.statBarSmall {
  height: 6px;
  background: var(--surface-2);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
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
  gap: 6px;
  flex-shrink: 0;
}
.statPctSmall {
  color: var(--muted);
  font-size: 11px;
  min-width: 32px;
  text-align: right;
}
.detailsBtn {
  padding: 4px 6px;
  height: 26px;
  font-size: 11px;
  white-space: nowrap;
}
</style>
