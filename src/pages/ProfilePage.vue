<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

const me = computed(() => auth.me);
</script>

<template>
	<div>
		<h1>Профиль</h1>

		<div v-if="me" class="card">
			<div><strong>ID:</strong> {{ me.id }}</div>
			<div><strong>Логин:</strong> {{ me.login }}</div>
			<div>
				<strong>ФИО:</strong> {{ me.lastname }} {{ me.firstname }}
				{{ me.middlename || "" }}
			</div>
			<div><strong>Роль:</strong> {{ me.role }}</div>
		</div>
	</div>
</template>

<style scoped>
.card {
	margin-top: 12px;
	display: grid;
	gap: 6px;
	padding: 12px;
	border: 1px solid rgba(0, 0, 0, 0.12);
	border-radius: 8px;
}
</style>
