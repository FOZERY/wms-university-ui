<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";

const props = defineProps<{
	modelValue: boolean;
	title?: string;
}>();
const emit = defineEmits(["update:modelValue", "close", "submit"] as const);

const visible = ref<boolean>(!!props.modelValue);
watch(() => props.modelValue, (v) => (visible.value = !!v));
watch(visible, (v) => emit("update:modelValue", v));

function close() {
	visible.value = false;
	emit("close");
}

function onKey(e: KeyboardEvent) {
	if (e.key === "Escape") close();
}

onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<template>
	<transition name="modal-fade">
		<div v-if="visible" class="modalOverlay" role="dialog" aria-modal="true">
			<div class="modalCard" @click.stop>
				<header class="modalHeader">
					<h3 class="modalTitle">{{ title }}</h3>
					<button class="modalClose" type="button" @click="close" aria-label="Закрыть">×</button>
				</header>

				<section class="modalBody">
					<slot />
				</section>

				<footer class="modalFooter">
					<slot name="footer" />
				</footer>
			</div>
		</div>
	</transition>
</template>

<style scoped>
.modalOverlay {
	position: fixed;
	inset: 0;
	background: rgb(0 0 0 / 48%);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 120;
	padding: 20px;
}

.modalCard {
	width: 100%;
	max-width: 720px;
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: 12px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.modalHeader {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	border-bottom: 1px solid var(--border);
}

.modalTitle {
	margin: 0;
	font-size: 16px;
	font-weight: 700;
}

.modalClose {
	background: transparent;
	border: none;
	font-size: 20px;
	padding: 4px 8px;
	cursor: pointer;
}

.modalBody {
	padding: 16px;
}

.modalFooter {
	padding: 12px 16px;
	border-top: 1px solid var(--border);
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
	transition: opacity 0.15s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
	opacity: 0;
}
</style>
