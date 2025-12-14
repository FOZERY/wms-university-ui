<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "../stores/auth";
import { getPermissions } from "../shared/auth/permissions";
import { mockWarehouses } from "../shared/mocks/data";

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));
</script>

<template>
	<div>
		<div class="pageHeader">
			<h1>Склады</h1>
			<div class="actions">
				<button
					v-if="permissions.canEditNomenclature"
					class="btn btnPrimary"
					type="button"
				>
					Создать склад
				</button>
			</div>
		</div>

		<table class="table">
			<thead>
				<tr>
					<th>ID</th>
					<th>Название</th>
					<th>Адрес</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="w in mockWarehouses" :key="w.id">
					<td>{{ w.id }}</td>
					<td>{{ w.name }}</td>
					<td>{{ w.address || "—" }}</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
