<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import EditableTable from "../components/EditableTable.vue";
import useDebounce from "../composables/useDebounce";
import type { Warehouse } from "../shared/api/types";
import { getPermissions } from "../shared/auth/permissions";
import { useAuthStore } from "../stores/auth";
import ModalForm from "../components/ModalForm.vue";
import FormField from "../components/FormField.vue";
import { warehousesApi, WarehousesListQuery } from "../shared/api/warehouses";

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

const columns = computed(() => [
  { key: "id" as keyof Warehouse, label: "ID", width: "60px" },
  { key: "name" as keyof Warehouse, label: "Название", editable: true },
  {
    key: "address" as keyof Warehouse,
    label: "Адрес",
    editable: true,
    format: (val: string | undefined) => val || "—",
  },
  {
    key: "capacity" as keyof Warehouse,
    label: "Вместимость",
    width: "120px",
    editable: true,
    format: (v: any) => (v == null ? "—" : String(v)),
  },
]);

const isLoading = ref(false);
const error = ref<string | null>(null);
const warehouses = ref<Warehouse[]>([]);
const sortRules = ref<Array<{ field: keyof Warehouse; direction: "asc" | "desc" }>>([]);
const searchQuery = ref("");
const debouncedSearch = useDebounce(searchQuery, 250);

async function load() {
  isLoading.value = true;
  error.value = null;
  try {
    const q: WarehousesListQuery = { limit: 30, offset: 0 };
    const s = debouncedSearch.value.trim();
    if (s) q.search = s;
    if (sortRules.value.length > 0) {
      const sortObj: Record<string, "asc" | "desc"> = {};
      for (const r of sortRules.value) sortObj[String(r.field)] = r.direction;
      // @ts-ignore
      (q as any).sort = sortObj;
    }
    warehouses.value = await warehousesApi.list(q);
  } catch (e) {
    console.error(e);
    error.value = "Не удалось загрузить склады.";
  } finally {
    isLoading.value = false;
  }
}

const displayedWarehouses = computed(() => warehouses.value);

watch(debouncedSearch, () => load());
function onTableSort(rules: Array<{ field: keyof Warehouse; direction: "asc" | "desc" }>) {
  sortRules.value = rules;
  load();
}
onMounted(load);

async function handleUpdate(
  item: Warehouse,
  field: keyof Warehouse,
  newValue: any
) {
  if (field === "id") return;
  try {
    const payload: any = { [String(field)]: newValue };
    await warehousesApi.patch(Number(item.id), payload);
    await load();
  } catch (e: any) {
    alert(e?.response?.data?.message || e?.message || "Не удалось сохранить");
  }
}
const showCreate = ref(false);
const creating = ref(false);
const createModel = ref<Partial<Warehouse>>({
  name: "",
  address: "",
  capacity: undefined,
});

function openCreate() {
  createModel.value = { name: "", address: "", capacity: undefined };
  showCreate.value = true;
}

async function submitCreate() {
  creating.value = true;
  try {
    if (!createModel.value.name) throw new Error("Название обязательно");
    const payload = {
      name: String(createModel.value.name),
      address: createModel.value.address || undefined,
      capacity:
        createModel.value.capacity != null
          ? Number(createModel.value.capacity)
          : undefined,
    };
    await warehousesApi.create(payload);
    showCreate.value = false;
    await load();
  } catch (e: any) {
    alert(
      e?.response?.data?.message || e?.message || "Не удалось создать склад"
    );
  } finally {
    creating.value = false;
  }
}
function clearSearch() {
  searchQuery.value = "";
  try {
    debouncedSearch.value = "";
  } catch {}
}
</script>

<template>
  <div>
    <div class="pageHeader">
      <h1>Склады</h1>
      <div class="searchWrap">
        <input
          v-model="searchQuery"
          class="searchInput"
          placeholder="Поиск по названию или адресу"
        />
        <button
          v-if="searchQuery"
          class="clearButton"
          type="button"
          @click="clearSearch"
        >
          ×
        </button>
      </div>
      <div class="actions">
        <button
          v-if="permissions.canEditNomenclature"
          class="btn btnPrimary"
          type="button"
          @click="openCreate"
        >
          Создать склад
        </button>
      </div>
    </div>

    <p v-if="isLoading">Загрузка…</p>
    <p v-else-if="error">{{ error }}</p>

    <EditableTable
      v-else
      :columns="columns"
      :data="displayedWarehouses"
      row-key="id"
      :can-edit="permissions.canEditNomenclature"
      :sort="sortRules"
      @sort="onTableSort"
      @update="handleUpdate"
      :rowLink="(item) => `/warehouses/${item.id}`"
    >
      <template #cell-name="{ item }">
        <span>{{ item.name }}</span>
      </template>
    </EditableTable>

    <ModalForm v-model="showCreate" title="Создать склад">
      <div>
        <FormField
          label="Название"
          v-model="createModel.name"
          placeholder="Название склада"
        />
        <FormField
          label="Адрес"
          v-model="createModel.address"
          placeholder="улица, дом"
        />
        <FormField
          label="Вместимость"
          v-model="createModel.capacity"
          placeholder="число (например, 500)"
        />
      </div>

      <template #footer>
        <button class="btn" type="button" @click="showCreate = false">
          Отмена
        </button>
        <button
          class="btn btnPrimary"
          type="button"
          @click="submitCreate"
          :disabled="creating"
        >
          {{ creating ? "Сохраняю..." : "Создать" }}
        </button>
      </template>
    </ModalForm>
  </div>
</template>

<style scoped>
.link {
  color: #646cff;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

/* header/actions/buttons use global styles in `src/style.css` */
</style>
