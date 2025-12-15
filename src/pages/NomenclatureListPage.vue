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
const openMenuId = ref<number | null>(null);

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

function toggleMenu(itemId: number) {
	openMenuId.value = openMenuId.value === itemId ? null : itemId;
}

function editItem(item: Item) {
	console.log("Редактировать:", item);
	openMenuId.value = null;
	// Здесь будет логика редактирования
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
					<th></th>
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
					<td style="position: relative">
						<button
							class="menuBtn"
							@click="toggleMenu(it.id)"
						>
							⋮
						</button>
						<div
							v-if="openMenuId === it.id"
							class="dropdownMenu"
						>
							<button @click="editItem(it)">
								Редактировать
							</button>
						</div>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<style scoped>
.menuBtn {
	background: transparent;
	border: none;
	cursor: pointer;
	font-size: 20px;
	padding: 4px 8px;
	color: var(--muted);
	border-radius: 4px;
}

.menuBtn:hover {
	background: var(--surface);
}

.dropdownMenu {
	position: absolute;
	right: 0;
	top: 100%;
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	z-index: 10;
	min-width: 150px;
	margin-top: 4px;
}

.dropdownMenu button {
	display: block;
	width: 100%;
	text-align: left;
	padding: 10px 16px;
	background: none;
	border: none;
	cursor: pointer;
	color: CanvasText;
}

.dropdownMenu button:hover {
	background: var(--surface-2);
}
</style>
