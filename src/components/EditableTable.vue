<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, onMounted, onUnmounted, useSlots } from "vue";

interface Column<T> {
	key: keyof T;
	label: string;
	editable?: boolean;
	type?: "text" | "select";
	options?: Array<{ value: any; label: string }>;
	format?: (value: any) => string;
	width?: string;
}

interface Props {
	columns: Column<T>[];
	data: T[];
	rowKey: keyof T;
	canEdit?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
	update: [item: T, field: keyof T, newValue: any];
}>();

const slots = useSlots();

type EditingCell = {
	itemId: any;
	field: keyof T;
};

const editingCell = ref<EditingCell | null>(null);
const editValue = ref<string>("");

function startEdit(item: T, field: keyof T, column: Column<T>) {
	if (!props.canEdit || !column.editable) return;

	editingCell.value = { itemId: item[props.rowKey], field };
	editValue.value = String(item[field]);
}

function isEditing(itemId: any, field: keyof T): boolean {
	return (
		editingCell.value?.itemId === itemId &&
		editingCell.value?.field === field
	);
}

async function saveEdit(item: T, column: Column<T>) {
	if (!editingCell.value) return;

	const field = editingCell.value.field;
	const oldValue = String(item[field as keyof T]);
	const newValue = editValue.value.trim();

	// Если значение не изменилось, просто закрываем редактирование
	if (oldValue === newValue) {
		editingCell.value = null;
		return;
	}

	// Показываем диалог подтверждения
	const confirmed = window.confirm(
		`Изменить "${column.label}" с "${oldValue}" на "${newValue}"?`
	);

	if (confirmed) {
		emit("update", item, field as keyof T, newValue);
	}

	editingCell.value = null;
}

function cancelEdit() {
	editingCell.value = null;
}

// Обработчик клика вне таблицы для закрытия редактирования
function handleClickOutside(event: MouseEvent) {
	if (!editingCell.value) return;

	const target = event.target as HTMLElement;
	// Проверяем, что клик был не по input/select/textarea
	if (!target.closest(".cellInput, .cellSelect")) {
		editingCell.value = null;
	}
}

onMounted(() => {
	document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
	<table class="table">
		<thead>
			<tr>
				<th
					v-for="col in columns"
					:key="String(col.key)"
					:style="col.width ? { width: col.width } : undefined"
				>
					{{ col.label }}
				</th>
				<th v-if="slots.actions"></th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="item in data" :key="item[rowKey]">
				<td
					v-for="col in columns"
					:key="String(col.key)"
					:class="{ editable: canEdit && col.editable }"
					@dblclick="startEdit(item, col.key, col)"
				>
					<!-- Select -->
					<select
						v-if="
							isEditing(item[rowKey], col.key) &&
							col.type === 'select'
						"
						v-model="editValue"
						class="cellSelect"
						@blur="saveEdit(item, col)"
						@change="saveEdit(item, col)"
						@keydown.esc="cancelEdit"
						autofocus
					>
						<option
							v-for="opt in col.options"
							:key="String(opt.value)"
							:value="opt.value"
						>
							{{ opt.label }}
						</option>
					</select>
					<!-- Textarea -->
					<textarea
						v-else-if="isEditing(item[rowKey], col.key)"
						v-model="editValue"
						class="cellInput"
						@blur="saveEdit(item, col)"
						@keydown.enter.prevent="saveEdit(item, col)"
						@keydown.esc="cancelEdit"
						rows="1"
						autofocus
					/>
					<!-- Display -->
					<span v-else>
						{{
							col.format
								? col.format(item[col.key])
								: item[col.key]
						}}
					</span>
				</td>
				<td v-if="slots.actions">
					<slot name="actions" :item="item"></slot>
				</td>
			</tr>
		</tbody>
	</table>
</template>

<style scoped>
.table {
	table-layout: fixed;
}

.editable {
	cursor: pointer;
	position: relative;
}

.editable:hover {
	background: var(--surface-2);
}

.cellInput,
.cellSelect {
	width: 100%;
	max-width: 100%;
	box-sizing: border-box;
	padding: 6px 8px;
	margin: -6px -8px;
	border: 1px solid var(--border);
	border-radius: 4px;
	background: var(--surface);
	color: CanvasText;
	font: inherit;
	resize: none;
	overflow-wrap: break-word;
	word-wrap: break-word;
	white-space: pre-wrap;
	min-height: 1.5em;
}

.cellInput:focus,
.cellSelect:focus {
	outline: 2px solid AccentColor;
	outline-offset: -1px;
}
</style>
