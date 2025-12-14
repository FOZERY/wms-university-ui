<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { getPermissions } from "../shared/auth/permissions";

const auth = useAuthStore();
const router = useRouter();

const permissions = computed(() => getPermissions(auth.role));

async function onLogout() {
	auth.logout();
	await router.push({ name: "login" });
}
</script>

<template>
	<div class="shell">
		<aside class="sidebar">
			<div class="brand">
				<div class="brandTitle">WMS</div>
				<div class="brandSub muted">Тракторный завод</div>
			</div>

			<nav class="nav">
				<RouterLink class="link" to="/documents">Документы</RouterLink>
				<RouterLink class="link" to="/stock">Остатки</RouterLink>
				<RouterLink class="link" to="/nomenclature"
					>Номенклатура</RouterLink
				>
				<RouterLink class="link" to="/warehouses">Склады</RouterLink>
				<RouterLink class="link" to="/suppliers">Поставщики</RouterLink>
				<RouterLink class="link" to="/profile">Профиль</RouterLink>
			</nav>

			<div class="sidebarFooter">
				<div v-if="auth.me" class="me">
					<div class="meName">{{ auth.me.login }}</div>
					<div class="meRole muted">{{ auth.me.role }}</div>
				</div>
				<button type="button" class="btn" @click="onLogout">
					Выйти
				</button>
			</div>
		</aside>

		<header class="topbar">
			<div class="topTitle">WMS — складской учет</div>
			<div
				class="topRight"
				v-if="
					permissions.canEditNomenclature ||
					permissions.canCancelDocuments
				"
			>
				<span class="muted">Права: manager-only действия включены</span>
			</div>
		</header>

		<main class="main">
			<div class="container">
				<slot />
			</div>
		</main>
	</div>
</template>

<style scoped>
.shell {
	min-height: 100vh;
	display: grid;
	grid-template-columns: var(--sidebar-width) 1fr;
	grid-template-rows: 56px 1fr;
	grid-template-areas:
		"sidebar topbar"
		"sidebar main";
}

.sidebar {
	grid-area: sidebar;
	border-right: 1px solid var(--border);
	background: var(--surface);
	padding: var(--space-3);
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.brandTitle {
	font-weight: 800;
	letter-spacing: 0.4px;
	font-size: 18px;
}

.brandSub {
	font-size: 12px;
}

.nav {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.link {
	text-decoration: none;
	padding: 10px 10px;
	border-radius: 10px;
	border: 1px solid transparent;
}

.link.router-link-active {
	background: color-mix(in srgb, AccentColor 14%, var(--surface));
	border-color: color-mix(in srgb, AccentColor 30%, var(--border));
}

.sidebarFooter {
	margin-top: auto;
	display: grid;
	gap: var(--space-2);
	padding-top: var(--space-2);
	border-top: 1px solid var(--border);
}

.meName {
	font-weight: 600;
}

.meRole {
	font-size: 12px;
}

.topbar {
	grid-area: topbar;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 var(--space-4);
	border-bottom: 1px solid var(--border);
	background: Canvas;
}

.topTitle {
	font-weight: 700;
}

.topRight {
	font-size: 12px;
}

.main {
	grid-area: main;
	padding: var(--space-4);
}
</style>
