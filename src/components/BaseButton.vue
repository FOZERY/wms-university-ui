<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    type?: "button" | "submit" | "reset";
    variant?: "default" | "primary" | "danger" | "secondary";
    onClick?: (e: MouseEvent) => void;
  }>(),
  {
    type: "button",
    variant: "default",
  }
);
</script>

<template>
  <button :type="props.type" :class="[
    'btn',
    {
      btnPrimary: props.variant === 'primary',
      btnDanger: props.variant === 'danger',
    },
  ]" @click="props.onClick && props.onClick($event)">
    <slot />
  </button>
</template>

<style scoped>
/* Keep visuals minimal; main styles live in global style.css */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
