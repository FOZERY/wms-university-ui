<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppShell from "./components/AppShell.vue";

const route = useRoute();

const useShell = computed(() => route.meta?.layout !== "auth");
</script>

<template>
	<AppShell v-if="useShell">
		<RouterView />
	</AppShell>
	<RouterView v-else />
</template>
