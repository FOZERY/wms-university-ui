<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { Supplier } from "../shared/api/types";
import { mockSuppliers } from "../shared/mocks/data";
import { useAuthStore } from "../stores/auth";
import { getPermissions } from "../shared/auth/permissions";
import EditableTable from "../components/EditableTable.vue";

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

const isLoading = ref(false);
const error = ref<string | null>(null);
const suppliers = ref<Supplier[]>([]);

const columns = computed(() => [
  { key: "id" as keyof Supplier, label: "ID", width: "60px" },
  { key: "name" as keyof Supplier, label: "Название", editable: true },
  {
    key: "inn" as keyof Supplier,
    label: "ИНН",
    editable: true,
    format: (val: string | undefined) => val || "—",
  },
  {
    key: "phone" as keyof Supplier,
    label: "Телефон",
    editable: true,
    format: (val: string | undefined) => val || "—",
  },
  {
    key: "email" as keyof Supplier,
    label: "Email",
    editable: true,
    format: (val: string | undefined) => val || "—",
  },
]);

async function load() {
  isLoading.value = true;
  error.value = null;

  try {
    suppliers.value = mockSuppliers;
  } catch {
    error.value = "Не удалось загрузить поставщиков.";
  } finally {
    isLoading.value = false;
  }
}

function handleUpdate(item: Supplier, field: keyof Supplier, newValue: any) {
  const itemIndex = suppliers.value.findIndex((s) => s.id === item.id);
  if (itemIndex !== -1) {
    (suppliers.value[itemIndex] as any)[field] = newValue;
  }
  console.log("Сохранено:", { supplierId: item.id, field, newValue });
}

onMounted(load);
</script>

<template>
  <div>
    <div class="pageHeader">
      <h1>Поставщики</h1>
      <div class="actions">
        <button class="btn" type="button" @click="load">Обновить</button>
      </div>
    </div>

    <p v-if="isLoading">Загрузка…</p>
    <p v-else-if="error">{{ error }}</p>

    <EditableTable
      v-else
      :columns="columns"
      :data="suppliers"
      row-key="id"
      :can-edit="false"
    />
  </div>
</template>
