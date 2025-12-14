<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { Supplier } from "../shared/api/types";
import { mockSuppliers } from "../shared/mocks/data";

const isLoading = ref(false);
const error = ref<string | null>(null);
const suppliers = ref<Supplier[]>([]);

async function load() {
	isLoading.value = true;
	error.value = null;

	try {
		suppliers.value = mockSuppliers;
	} catch {
		error.value = "Не удалось загрузить поставщиков.";
	} finally {
		isLoading.value = false;
	}
}

onMounted(load);
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Поставщики</h1>
			<div class="actions">
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
					<th>Название</th>
					<th>ИНН</th>
					<th>Телефон</th>
					<th>Email</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="s in suppliers" :key="s.id">
					<td>{{ s.id }}</td>
					<td>{{ s.name }}</td>
					<td>{{ s.inn || "—" }}</td>
					<td>{{ s.phone || "—" }}</td>
					<td>{{ s.email || "—" }}</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
