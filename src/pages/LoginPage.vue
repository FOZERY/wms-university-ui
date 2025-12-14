<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import type { UserRole } from "../shared/api/types";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

function pick(role: UserRole) {
	auth.selectRole(role);
	const redirect =
		typeof route.query.redirect === "string" ? route.query.redirect : "/";
	router.push(redirect);
}
</script>

<template>
	<div class="wrap">
		<h1>Выбор роли (mock)</h1>

		<div class="form">
			<button class="btn" type="button" @click="pick('manager')">
				Менеджер
			</button>
			<button class="btn" type="button" @click="pick('storeKeeper')">
				Заведующий складом
			</button>
		</div>

		<p class="hint">Авторизация и данные сейчас моковые (без бэка).</p>
	</div>
</template>

<style scoped>
.wrap {
	max-width: 420px;
	margin: 48px auto;
	padding: 0 16px;
}

.form {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.btn {
	padding: 10px 12px;
}

.hint {
	margin-top: 16px;
	opacity: 0.8;
}
</style>
