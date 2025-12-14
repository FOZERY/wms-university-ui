<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { getPermissions } from "../shared/auth/permissions";
import { mockStock } from "../shared/mocks/data";

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

type WarehouseFilter = "all" | "materials" | "products";
const warehouseFilter = ref<WarehouseFilter>("all");

function mapWarehouseToRu(warehouseName: string): string {
	// Простая маппинга под текущие моки.
	return warehouseName.includes("Готов")
		? "Склад готовой продукции"
		: "Склад материалов";
}

const filteredStock = computed(() => {
	if (warehouseFilter.value === "all") return mockStock;
	if (warehouseFilter.value === "products") {
		return mockStock.filter((r) => r.warehouseName.includes("Готов"));
	}
	return mockStock.filter((r) => !r.warehouseName.includes("Готов"));
});
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Остатки</h1>
			<div class="actions">
				<label class="muted">
					Склад:&nbsp;
					<select v-model="warehouseFilter" class="select">
						<option value="all">Все</option>
						<option value="materials">Склад материалов</option>
						<option value="products">
							Склад готовой продукции
						</option>
					</select>
				</label>
				<button
					v-if="permissions.canAdjustStock"
					class="btn btnPrimary"
					type="button"
				>
					Корректировка
				</button>
			</div>
		</div>

		<table class="table">
			<thead>
				<tr>
					<th>Склад</th>
					<th>Товар</th>
					<th>Кол-во</th>
					<th>Резерв</th>
					<th>Доступно</th>
				</tr>
			</thead>
			<tbody>
				<tr
					v-for="row in filteredStock"
					:key="`${row.warehouseId}:${row.itemId}`"
				>
					<td>{{ mapWarehouseToRu(row.warehouseName) }}</td>
					<td>{{ row.itemName }}</td>
					<td>{{ row.quantity }}</td>
					<td>{{ row.reserved }}</td>
					<td>{{ row.available }}</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
