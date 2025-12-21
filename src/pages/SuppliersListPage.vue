<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import EditableTable from "../components/EditableTable.vue";
import useDebounce from "../composables/useDebounce";
import type { Supplier } from "../shared/api/types";
import { suppliersApi, SuppliersListQuery } from "../shared/api/suppliers";
import ModalForm from "../components/ModalForm.vue";
import FormField from "../components/FormField.vue";
import { useAuthStore } from "../stores/auth";
import { getPermissions } from "../shared/auth/permissions";

const isLoading = ref(false);
const error = ref<string | null>(null);
const suppliers = ref<Supplier[]>([]);
const searchQuery = ref("");
const debouncedSearch = useDebounce(searchQuery, 250);

function clearSearch() {
  searchQuery.value = "";
  try {
    debouncedSearch.value = "";
  } catch {}
}

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

const sortRules = ref<
  Array<{ field: keyof Supplier; direction: "asc" | "desc" }>
>([]);

async function load() {
  isLoading.value = true;
  error.value = null;

  try {
    const query: SuppliersListQuery = {
      // keep page size reasonable for this list view
      limit: 30,
      offset: 0,
    };

    const q = debouncedSearch.value.trim();
    if (q) query.search = q;

    // if we have a sort rule, send it as deep object (axios will serialize as sort[name]=asc)
    if (sortRules.value.length > 0) {
      // build sort object taking first rule (primary sort)
      const primary = sortRules.value[0];
      // @ts-ignore - we'll pass sort dynamically
      (query as any).sort = { [String(primary.field)]: primary.direction };
    }

    suppliers.value = await suppliersApi.list(query);
  } catch (e) {
    console.error(e);
    error.value = "Не удалось загрузить поставщиков.";
  } finally {
    isLoading.value = false;
  }
}

const displayedSuppliers = computed(() => suppliers.value);

// reload when debounced search changes
watch(debouncedSearch, () => load());

function onTableSort(
  rules: Array<{ field: keyof Supplier; direction: "asc" | "desc" }>
) {
  sortRules.value = rules;
  load();
}

// no update handler required for suppliers list at the moment

onMounted(load);

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

const showCreate = ref(false);
const creating = ref(false);
const createModel = ref<Partial<Supplier>>({
  name: "",
  inn: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
});

function openCreate() {
  createModel.value = {
    name: "",
    inn: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  };
  showCreate.value = true;
}

async function submitCreate() {
  creating.value = true;
  try {
    if (!createModel.value.name) throw new Error("Название обязательно");

    // call backend to create supplier
    const payload = {
      name: String(createModel.value.name),
      inn: createModel.value.inn || undefined,
      contactPerson: createModel.value.contactPerson || undefined,
      phone: createModel.value.phone || undefined,
      email: createModel.value.email || undefined,
      address: createModel.value.address || undefined,
    };

    const res = await suppliersApi.create(payload);
    // on success, reload list from server
    await load();
    showCreate.value = false;
  } catch (e: any) {
    alert(
      e?.response?.data?.message ||
        e?.message ||
        "Не удалось создать поставщика"
    );
  } finally {
    creating.value = false;
  }
}

async function handleUpdate(
  item: Supplier,
  field: keyof Supplier,
  newValue: any
) {
  if (field === "id") return;
  try {
    const payload: any = { [String(field)]: newValue };
    await suppliersApi.patch(Number(item.id), payload);
    await load();
  } catch (e: any) {
    alert(e?.response?.data?.message || e?.message || "Не удалось сохранить");
  }
}
</script>

<template>
  <div>
    <div class="pageHeader">
      <h1>Поставщики</h1>
      <div class="searchWrap">
        <input
          v-model="searchQuery"
          class="searchInput"
          placeholder="Поиск по названию, ИНН..."
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
        <button class="btn" type="button" @click="load">Обновить</button>
        <button
          v-if="permissions.canEditNomenclature"
          class="btn btnPrimary"
          type="button"
          @click="openCreate"
        >
          Создать поставщика
        </button>
      </div>
    </div>

    <p v-if="isLoading">Загрузка…</p>
    <p v-else-if="error">{{ error }}</p>

    <EditableTable
      v-else
      :columns="columns"
      :data="displayedSuppliers"
      row-key="id"
      :can-edit="permissions.canEditNomenclature"
      :rowLink="(item) => `/suppliers/${item.id}`"
      @sort="onTableSort"
      @update="handleUpdate"
    >
      <template #cell-name="{ item }">
        <span>{{ item.name }}</span>
      </template>
    </EditableTable>

    <ModalForm v-model="showCreate" title="Создать поставщика">
      <div>
        <FormField
          label="Название"
          v-model="createModel.name"
          placeholder="ООО Ромашка"
        />
        <FormField
          label="ИНН"
          v-model="createModel.inn"
          placeholder="7700000000"
        />
        <FormField
          label="Контактное лицо"
          v-model="createModel.contactPerson"
          placeholder="ФИО"
        />
        <FormField
          label="Телефон"
          v-model="createModel.phone"
          placeholder="+7 (900) 000-00-00"
        />
        <FormField
          label="Email"
          v-model="createModel.email"
          placeholder="contact@company.test"
        />
        <FormField
          label="Адрес"
          type="textarea"
          v-model="createModel.address"
          placeholder="город, улица, дом"
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
          {{ creating ? "Создаю..." : "Создать" }}
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
