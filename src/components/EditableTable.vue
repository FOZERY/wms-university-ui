<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, onMounted, onUnmounted, useSlots, computed } from "vue";

interface Column<T> {
	key: keyof T;
	label: string;
	editable?: boolean;
	type?: "text" | "select";
	options?: Array<{ value: any; label: string }>;
	format?: (value: any) => string;
	width?: string;
	sortable?: boolean;
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

type SortDirection = "asc" | "desc";
type SortRule = {
	field: keyof T;
	direction: SortDirection;
};

const sortRules = ref<SortRule[]>([]);

function toggleSort(field: keyof T, shiftKey: boolean) {
	const existingIndex = sortRules.value.findIndex((r) => r.field === field);

	if (!shiftKey) {
		// Обычный клик - сортировка только по одному полю
		if (existingIndex !== -1) {
			const currentDirection = sortRules.value[existingIndex].direction;
			if (currentDirection === "asc") {
				sortRules.value = [{ field, direction: "desc" }];
			} else {
				sortRules.value = [];
			}
		} else {
			sortRules.value = [{ field, direction: "asc" }];
		}
	} else {
		// Shift+клик - множественная сортировка
		if (existingIndex !== -1) {
			const currentDirection = sortRules.value[existingIndex].direction;
			if (currentDirection === "asc") {
				sortRules.value[existingIndex].direction = "desc";
			} else {
				sortRules.value.splice(existingIndex, 1);
			}
		} else {
			sortRules.value.push({ field, direction: "asc" });
		}
	}
}

function getSortState(
	field: keyof T
): { direction: SortDirection; order: number } | null {
	const index = sortRules.value.findIndex((r) => r.field === field);
	if (index === -1) return null;
	return {
		direction: sortRules.value[index].direction,
		order: index + 1,
	};
}

const sortedData = computed(() => {
	if (sortRules.value.length === 0) return props.data;

	return [...props.data].sort((a, b) => {
		for (const rule of sortRules.value) {
			const aVal = a[rule.field];
			const bVal = b[rule.field];

			let comparison = 0;
			if (aVal < bVal) comparison = -1;
			else if (aVal > bVal) comparison = 1;

			if (comparison !== 0) {
				return rule.direction === "asc" ? comparison : -comparison;
			}
		}
		return 0;
	});
});

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
					:class="{ sortable: col.sortable !== false }"
					@click="
						col.sortable !== false
							? toggleSort(col.key, $event.shiftKey)
							: undefined
					"
				>
					<div class="thContent">
						<span>{{ col.label }}</span>
						<span
							v-if="col.sortable !== false"
							class="sortIndicator"
						>
							<template v-if="getSortState(col.key)">
								<span class="sortArrow">{{
									getSortState(col.key)!.direction === "asc"
										? "↑"
										: "↓"
								}}</span>
								<span
									v-if="sortRules.length > 1"
									class="sortOrder"
									>{{ getSortState(col.key)!.order }}</span
								>
							</template>
							<span v-else class="sortArrow inactive">⇅</span>
						</span>
					</div>
				</th>
				<th v-if="slots.actions"></th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="item in sortedData" :key="item[rowKey]">
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
						<slot
							:name="`cell-${String(col.key)}`"
							:item="item"
							:value="item[col.key]"
						>
							{{
								col.format
									? col.format(item[col.key])
									: item[col.key]
							}}
						</slot>
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

.table td span {
	display: block;
	overflow-wrap: anywhere;
	word-break: break-word;
	white-space: normal;
}

.table thead th.sortable {
	cursor: pointer;
	user-select: none;
	transition: background 0.15s ease;
}

.table thead th.sortable:hover {
	background: color-mix(in srgb, var(--surface-2) 80%, AccentColor 20%);
}

.thContent {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 6px;
}

.sortIndicator {
	display: inline-flex;
	align-items: center;
	gap: 2px;
	font-size: 11px;
	flex-shrink: 0;
}

.sortArrow {
	font-size: 14px;
	line-height: 1;
}

.sortArrow.inactive {
	opacity: 0.3;
	font-size: 12px;
}

.sortOrder {
	font-size: 10px;
	background: AccentColor;
	color: white;
	border-radius: 3px;
	padding: 1px 3px;
	min-width: 12px;
	text-align: center;
	font-weight: 600;
}
</style>
