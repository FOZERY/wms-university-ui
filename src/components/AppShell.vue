<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { getPermissions } from "../shared/auth/permissions";
import { roleToLabel } from "../shared/auth/permissions";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();

const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 180;
const MAX_WIDTH = 420;
const COLLAPSE_THRESHOLD = 130;

const sidebarWidth = ref(DEFAULT_WIDTH);
const lastExpandedWidth = ref(DEFAULT_WIDTH);
const collapsed = ref(false);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartWidth = ref(DEFAULT_WIDTH);

const permissions = computed(() => getPermissions(auth.role));
const displayRole = computed(() => roleToLabel(auth.role));
const displayName = computed(() => {
  if (!auth.me) return "";
  const fn = auth.me.firstname ?? "";
  const ln = auth.me.lastname ?? "";
  if (fn || ln) return `${fn} ${ln}`.trim();
  return auth.me.login ?? "";
});

async function onLogout() {
  auth.logout();
  await router.push({ name: "login" });
}

function toggleSidebar(force?: boolean) {
  const next = force ?? !collapsed.value;
  if (next) {
    collapsed.value = true;
  } else {
    collapsed.value = false;
    sidebarWidth.value = Math.min(
      Math.max(lastExpandedWidth.value, MIN_WIDTH),
      MAX_WIDTH
    );
  }
}

function onDragStart(event: PointerEvent) {
  if (collapsed.value) return;
  isDragging.value = true;
  dragStartX.value = event.clientX;
  dragStartWidth.value = sidebarWidth.value;
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd);
}

function onDragMove(event: PointerEvent) {
  if (!isDragging.value) return;
  const delta = event.clientX - dragStartX.value;
  const nextWidth = Math.min(
    Math.max(dragStartWidth.value + delta, MIN_WIDTH),
    MAX_WIDTH
  );

  if (nextWidth < COLLAPSE_THRESHOLD) {
    lastExpandedWidth.value = Math.max(MIN_WIDTH, dragStartWidth.value);
    toggleSidebar(true);
    onDragEnd();
    return;
  }

  collapsed.value = false;
  sidebarWidth.value = nextWidth;
  lastExpandedWidth.value = nextWidth;
}

function onDragEnd() {
  if (!isDragging.value) return;
  isDragging.value = false;
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
}

onMounted(() => {
  window.addEventListener("pointerup", onDragEnd);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
});
</script>

<template>
  <div
    class="shell"
    :class="{ isDragging }"
    :style="{ '--sidebar-width': (collapsed ? 0 : sidebarWidth) + 'px' }"
  >
    <aside class="sidebar" :class="{ collapsed }">
      <RouterLink to="/" class="brand">
        <div class="brandTitle">WMS</div>
        <div class="brandSub muted">Тракторный завод</div>
      </RouterLink>

      <nav class="nav">
        <RouterLink class="link" to="/documents">Документы</RouterLink>
        <RouterLink class="link" to="/stock">Остатки</RouterLink>
        <RouterLink class="link" to="/nomenclature">Номенклатура</RouterLink>
        <RouterLink class="link" to="/warehouses">Склады</RouterLink>
        <RouterLink class="link" to="/suppliers">Поставщики</RouterLink>
      </nav>

      <div class="sidebarFooter">
        <RouterLink v-if="auth.me" to="/profile" class="me">
          <div class="meName">{{ displayName }}</div>
          <div class="meRole muted">{{ displayRole }}</div>
        </RouterLink>
        <button type="button" class="btn" @click="onLogout">Выйти</button>
      </div>

      <div class="resizeHandle" @pointerdown.prevent="onDragStart"></div>
    </aside>

    <header class="topbar">
      <button
        class="ghostIcon"
        type="button"
        @click="toggleSidebar()"
        title="Переключить меню"
      >
        <svg
          v-if="collapsed"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <svg
          v-else
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="11 17 6 12 11 7"></polyline>
          <polyline points="18 17 13 12 18 7"></polyline>
        </svg>
      </button>
      <div class="topTitle">WMS — складской учет</div>
      <div
        class="topRight"
        v-if="permissions.canEditNomenclature || permissions.canCancelDocuments"
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
  transition: grid-template-columns 0.2s ease;
}

.shell.isDragging {
  transition: none;
}

.sidebar {
  grid-area: sidebar;
  border-right: 1px solid var(--border);
  background: var(--surface);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  position: relative;
  overflow: hidden;
}

.brandTitle {
  font-weight: 800;
  letter-spacing: 0.4px;
  font-size: 18px;
}

.brandSub {
  font-size: 12px;
}

.brand {
  text-decoration: none;
  color: inherit;
  display: block;
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

.me {
  text-decoration: none;
  color: inherit;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.15s ease;
  cursor: pointer;
}

.me:hover {
  background: color-mix(in srgb, CanvasText 5%, transparent);
}

.meName {
  font-weight: 600;
}

.meRole {
  font-size: 12px;
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

.resizeHandle {
  position: absolute;
  right: -4px;
  top: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--border) 60%, transparent) 50%,
    transparent 100%
  );
}

.sidebar.collapsed {
  padding: 0;
  border-right-color: transparent;
  transition: padding 0.2s ease, border-right-color 0.2s ease;
}

.sidebar.collapsed .brand,
.sidebar.collapsed .nav,
.sidebar.collapsed .sidebarFooter,
.sidebar.collapsed .resizeHandle {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

.brand,
.nav,
.sidebarFooter {
  transition: opacity 0.15s ease, visibility 0.15s ease;
}

.ghostIcon {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  margin-right: var(--space-3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.ghostIcon:hover {
  background: var(--surface-2);
  border-color: color-mix(in srgb, CanvasText 20%, transparent);
}

.ghostIcon svg {
  display: block;
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
</style>
