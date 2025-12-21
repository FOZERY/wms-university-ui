<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  label?: string;
  modelValue?: string | number | null;
  type?: string;
  placeholder?: string;
  error?: string | null;
  rows?: number;
  options?: Array<{ value: any; label: string }>;
}>();
const emit = defineEmits(["update:modelValue"] as const);

const inner = computed({
  get: () => props.modelValue,
  set: (v: any) => emit("update:modelValue", v),
});
</script>

<template>
  <label class="formField">
    <div v-if="label" class="formLabel">{{ label }}</div>
    <div class="formControl">
      <input
        v-if="type !== 'textarea' && type !== 'select'"
        :type="type || 'text'"
        :placeholder="placeholder"
        v-model="inner"
        class="fieldInput"
      />

      <textarea
        v-else-if="type === 'textarea'"
        :rows="rows || 3"
        :placeholder="placeholder"
        v-model="inner"
        class="fieldTextarea"
      />

      <select v-else-if="type === 'select'" v-model="inner" class="fieldSelect">
        <option
          v-for="opt in options || []"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>
    <div v-if="error" class="fieldError">{{ error }}</div>
  </label>
</template>

<style scoped>
.formField {
  display: block;
  margin-bottom: 12px;
}

.formLabel {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 6px;
}

.formControl {
  display: block;
}

.fieldInput,
.fieldTextarea,
.fieldSelect {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--border);
  background: var(--surface);
  color: inherit;
  padding: 8px 10px;
  border-radius: 8px;
  /* match button text size and height for visual parity */
  font-size: 16px;
  height: 40px;
}

.fieldTextarea {
  min-height: 80px;
}

.fieldError {
  margin-top: 6px;
  color: #f06e6e;
  font-size: 12px;
}
</style>
