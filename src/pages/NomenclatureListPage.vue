<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { Item } from "../shared/api/types";
import { mockItems } from "../shared/mocks/data";
import { useAuthStore } from "../stores/auth";
import { getPermissions } from "../shared/auth/permissions";

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

const isLoading = ref(false);
const error = ref<string | null>(null);
const items = ref<Item[]>([]);

type TypeFilter = "all" | Item["type"];
const typeFilter = ref<TypeFilter>("all");

function mapItemTypeToRu(type: Item["type"]): string {
	return type === "material" ? "Материал" : "Готовая продукция";
}

const filteredItems = computed(() => {
	if (typeFilter.value === "all") return items.value;
	return items.value.filter((it) => it.type === typeFilter.value);
});

async function load() {
	isLoading.value = true;
	error.value = null;

	try {
		items.value = mockItems;
	} catch {
		error.value = "Не удалось загрузить номенклатуру.";
	} finally {
		isLoading.value = false;
	}
}

onMounted(load);
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Номенклатура</h1>
			<div class="actions">
				<label class="muted">
					Тип:&nbsp;
					<select v-model="typeFilter" class="select">
						<option value="all">Все</option>
						<option value="material">Материал</option>
						<option value="product">Готовая продукция</option>
					</select>
				</label>
				<button
					v-if="permissions.canEditNomenclature"
					class="btn btnPrimary"
					type="button"
				>
					Создать позицию
				</button>
				<button class="btn" type="button" @click="load">
					Обновить
				</button>
			</div>
		</div>

		<p v-if="isLoading">Загрузка…</p>
		<p v-else-if="error">{{ error }}</p>

		<table v-else class="table">
			<thead>
				<tr>
					<th>ID</th>
					<th>Код</th>
					<th>Название</th>
					<th>Тип</th>
					<th>Ед.</th>
					<th>Мин. остаток</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="it in filteredItems" :key="it.id">
					<td>{{ it.id }}</td>
					<td>{{ it.code }}</td>
					<td>{{ it.name }}</td>
					<td>{{ mapItemTypeToRu(it.type) }}</td>
					<td>{{ it.unit }}</td>
					<td>{{ it.minQuantity }}</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
