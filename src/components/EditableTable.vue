<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref, useSlots } from "vue";
import { useRouter } from "vue-router";

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
  /** optional function to compute a route path for a row */
  rowLink?: (item: T) => string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  update: [item: T, field: keyof T, newValue: any];
  sort: [any[]];
}>();

const slots = useSlots();
const router = useRouter();

function onRowClick(item: T, e?: MouseEvent) {
  try {
    if (!props.rowLink) return;
    // ignore clicks on interactive elements inside the row
    if (e) {
      const el = (e.target as HTMLElement)?.closest?.(
        "a,button,input,select,textarea,label"
      );
      if (el) return;
    }
    const to = props.rowLink(item);
    if (to) router.push(to);
  } catch (err) {
    // swallow
  }
}

type SortDirection = "asc" | "desc";
type SortRule = {
  field: keyof T;
  direction: SortDirection;
};

const sortRules = ref<SortRule[]>([]);

function toggleSort(field: keyof T) {
  const existingIndex = sortRules.value.findIndex((r) => r.field === field);

  if (existingIndex !== -1) {
    const rule = sortRules.value[existingIndex];
    if (rule) {
      if (rule.direction === "asc") rule.direction = "desc";
      else sortRules.value.splice(existingIndex, 1);
    }
  } else {
    sortRules.value.push({ field: field as any, direction: "asc" });
  }

  // emit sort change for parent components to handle server-side sorting
  emit("sort", sortRules.value.slice());
}
// end of toggleSort

function getSortState(
  field: keyof T
): { direction: SortDirection; order: number } | null {
  const index = sortRules.value.findIndex((r) => r.field === field);
  if (index === -1) return null;
  const rule = sortRules.value[index];
  if (!rule) return null;
  return { direction: rule.direction, order: index + 1 };
}

const sortedData = computed(() => {
  if (sortRules.value.length === 0) return props.data as T[];

  return [...props.data].sort((a, b) => {
    for (const rule of sortRules.value) {
      const key = rule.field as unknown as string;
      const aVal = (a as any)[key];
      const bVal = (b as any)[key];

      let comparison = 0;
      if (aVal == null && bVal != null) comparison = -1;
      else if (aVal != null && bVal == null) comparison = 1;
      else if (aVal < bVal) comparison = -1;
      else if (aVal > bVal) comparison = 1;

      if (comparison !== 0)
        return rule.direction === "asc" ? comparison : -comparison;
    }
    return 0;
  });
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
          @click="col.sortable !== false ? toggleSort(col.key) : undefined"
        >
          <div class="thContent">
            <span>{{ col.label }}</span>
            <span v-if="col.sortable !== false" class="sortIndicator">
              <template v-if="getSortState(col.key)">
                <span class="sortArrow">{{
                  getSortState(col.key)!.direction === "asc" ? "↑" : "↓"
                }}</span>
                <span v-if="sortRules.length > 1" class="sortOrder">{{
                  getSortState(col.key)!.order
                }}</span>
              </template>
              <span v-else class="sortArrow inactive">⇅</span>
            </span>
          </div>
        </th>
        <th v-if="slots.actions"></th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in sortedData"
        :key="item[rowKey]"
        :class="{ clickable: !!(props.rowLink && props.rowLink(item)) }"
        @click="onRowClick(item, $event)"
      >
        <td v-for="col in columns" :key="String(col.key)">
          <slot
            :name="`cell-${String(col.key)}`"
            :item="item"
            :value="item[col.key]"
          >
            {{ col.format ? col.format(item[col.key]) : item[col.key] }}
          </slot>
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
  width: 100%;
  border-collapse: collapse;
  margin-top: var(--space-3);
}

.table th,
.table td {
  text-align: left;
  padding: var(--space-2);
  border-bottom: 1px solid var(--border);
}

.table th {
  color: var(--muted);
  font-weight: 500;
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

.clickable {
  cursor: pointer;
}

.clickable:hover td {
  background: color-mix(in srgb, var(--surface-2) 85%, transparent);
}
</style>
