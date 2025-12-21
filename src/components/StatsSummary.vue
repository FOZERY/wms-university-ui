<script setup lang="ts">
import { useRouter } from "vue-router";
import BaseButton from "./BaseButton.vue";

export type SummaryItem = {
	id: number;
	name: string;
	percent: number;
};

const { items } = defineProps<{ items: SummaryItem[] }>();
const router = useRouter();

function onDetails(id: number) {
	router.push(`/warehouses/${id}`);
}
</script>

<template>
	<div class="statsSummary">
		<h4 v-if="items?.length">Сводка по складам</h4>
		<div class="legendRow">
			<div class="legendItem">
				<span class="dot occupied"></span> Занято
			</div>
			<div class="legendItem">
				<span class="dot free"></span> Свободно
			</div>
		</div>
		<ul class="statsListSmall">
			<li v-for="it in items" :key="it.id" class="statItemSmall">
				<div class="statLeft">
					<div class="statNameSmall">{{ it.name }}</div>
					<div class="statBarRow">
						<div class="statBarSmall">
							<div class="statFillSmall" :style="{ width: it.percent + '%' }" :class="{
								warn: it.percent >= 80 && it.percent < 90,
								danger: it.percent >= 90,
							}"></div>
						</div>
						<span class="statPctSmall">{{ it.percent }}%</span>
					</div>
				</div>
				<div class="statRight">
					<BaseButton type="button" class="detailsBtn" @click="onDetails(it.id)">Детали</BaseButton>
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
	/* limit height and allow scrolling inside the summary list */
	max-height: calc(var(--chart-card-chart-height) - 70px);
	overflow: auto;
}

.statItemSmall {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 6px;
}

.statLeft {
	flex: 1 1 auto;
	min-width: 0;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	gap: 2px;
}

.statNameSmall {
	font-weight: 500;
	font-size: 12px;
	white-space: normal;
	overflow: visible;
	word-break: break-word;
}

.statBarRow {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 4px;
	min-width: 0;
}

.statBarSmall {
	flex: 1 1 auto;
	height: 6px;
	background: var(--surface-2);
	border-radius: 3px;
	overflow: hidden;
	min-width: 0;
}

.statPctSmall {
	color: var(--muted);
	font-size: 11px;
	min-width: 28px;
	text-align: right;
	flex-shrink: 0;
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
	align-items: flex-end;
	justify-content: center;
	flex-shrink: 0;
}

.detailsBtn {
	padding: 4px 6px;
	height: 26px;
	font-size: 11px;
	white-space: nowrap;
}
</style>
