<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { openPdfAndPrint } from '../shared/utils/print';
const props = defineProps<{ blob: Blob; filename?: string }>();
const emit = defineEmits(['close']);

function close() {
	emit('close');
}

onMounted(() => {
	try {
		openPdfAndPrint(props.blob, props.filename);
	} catch (e) {
		console.error('openPdfAndPrint error', e);
	}
	// close the modal immediately since PDF opens in a new tab
	setTimeout(() => close(), 200);
});
</script>

<template>
	<div class="pdf-print-modal">
		<div class="overlay" @click="close"></div>
		<div class="modal">
			<div class="modalHeader">
				<div class="title">Печать документа</div>
				<button class="closeBtn" @click="close">✕</button>
			</div>
			<div class="modalBody">
				<iframe ref="iframeRef" style="width:100%;height:80vh;border:0"></iframe>
			</div>
			<div class="modalFooter">
				<button class="btn" @click="close">Закрыть</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.pdf-print-modal .overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.6);
	z-index: 2000;
}

.pdf-print-modal .modal {
	position: fixed;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	width: 90%;
	max-width: 1000px;
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: 8px;
	z-index: 2001;
	overflow: hidden
}

.modalHeader {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	border-bottom: 1px solid var(--border)
}

.modalBody {
	padding: 8px
}

.modalFooter {
	display: flex;
	justify-content: flex-end;
	padding: 8px 16px;
	border-top: 1px solid var(--border)
}

.closeBtn {
	background: none;
	border: none;
	font-size: 18px;
	cursor: pointer
}
</style>
