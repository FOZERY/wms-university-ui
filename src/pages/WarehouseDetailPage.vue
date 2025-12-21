<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ModalForm from "../components/ModalForm.vue";
import FormField from "../components/FormField.vue";
import { useAuthStore } from "../stores/auth";
import { getPermissions } from "../shared/auth/permissions";
import { warehousesApi } from "../shared/api/warehouses";
import { documentsApi } from "../shared/api/documents";
import { stockApi } from "../shared/api/stock";

const route = useRoute();
const router = useRouter();
const warehouseId = route.params.id as string;

const warehouse = ref<any>(null);
const loading = ref(true);
const deleting = ref(false);
const showEdit = ref(false);
const saving = ref(false);
const formModel = ref<any>({});
const showDelete = ref(false);
const recentDocuments = ref<any[]>([]);
const docsLoading = ref(false);
const stock = ref<any[]>([]);
const stockLoading = ref(false);

const auth = useAuthStore();
const permissions = computed(() => getPermissions(auth.role));

async function loadWarehouse(idParam?: string) {
  const idToLoad = idParam ?? (route.params.id as string);
  console.debug("loadWarehouse start", { id: idToLoad });
  loading.value = true;
  try {
    const data = await warehousesApi.getById(Number(idToLoad));
    console.debug("loadWarehouse response", data);
    warehouse.value = data;
  } catch (e) {
    console.error("loadWarehouse error", e);
    warehouse.value = null;
  } finally {
    loading.value = false;
    console.debug("loadWarehouse finished", { loading: loading.value });
  }
}

onMounted(async () => {
  await loadWarehouse();
  await Promise.all([loadRecentDocuments(), loadStock()]);
});

// reload when route id changes (router may reuse the component)
watch(
  () => route.params.id,
  (v) => {
    if (v) loadWarehouse(String(v));
  }
);

async function loadRecentDocuments(idParam?: string) {
  const idToLoad = idParam ?? (route.params.id as string);
  if (!idToLoad) return;
  docsLoading.value = true;
  try {
    const params = {
      warehouseId: Number(idToLoad),
      limit: 10,
      offset: 0,
      // sort by date desc to get latest
      sort: { date: "desc" },
    } as any;
    const { data } = await documentsApi.getAll(params);
    recentDocuments.value = data || [];
  } catch (e) {
    console.error("loadRecentDocuments error", e);
    recentDocuments.value = [];
  } finally {
    docsLoading.value = false;
  }
}

// reload recent documents when route id changes
watch(
  () => route.params.id,
  (v) => {
    if (v) loadRecentDocuments(String(v));
  }
);

// reload stock when route id changes
watch(
  () => route.params.id,
  (v) => {
    if (v) loadStock(String(v));
  }
);

async function loadStock(idParam?: string) {
  const idToLoad = idParam ?? (route.params.id as string);
  if (!idToLoad) return;
  stockLoading.value = true;
  try {
    // enforce page size: UI requests at most 10 (backend supports up to 100)
    const params = {
      warehouseId: Number(idToLoad),
      limit: 10,
      offset: 0,
      sort: { itemName: "asc" },
    } as any;
    const { data } = await stockApi.getAll(params);
    stock.value = data || [];
  } catch (e) {
    console.error("loadStock error", e);
    stock.value = [];
  } finally {
    stockLoading.value = false;
  }
}

const goBack = () => router.back();

function openEdit() {
  formModel.value = {
    name: warehouse.value.name,
    address: warehouse.value.address,
    capacity: warehouse.value.capacity ?? null,
  };
  showEdit.value = true;
}

function confirmDeleteWarehouse() {
  showDelete.value = true;
}

async function performDeleteWarehouse() {
  if (!warehouse.value) return;
  deleting.value = true;
  try {
    await warehousesApi.delete(Number(warehouse.value.id));
    showDelete.value = false;
    await router.push({ path: "/warehouses" });
  } catch (e: any) {
    alert(
      e?.response?.data?.message || e?.message || "Не удалось удалить склад"
    );
  } finally {
    deleting.value = false;
  }
}

async function submitEdit() {
  saving.value = true;
  try {
    if (!formModel.value.name) throw new Error("Название обязательно");
    await warehousesApi.patch(Number(warehouseId), {
      name: String(formModel.value.name),
      address: String(formModel.value.address || ""),
      capacity:
        formModel.value.capacity != null
          ? Number(formModel.value.capacity)
          : undefined,
    });
    // reload details
    await loadWarehouse();
    showEdit.value = false;
  } catch (e: any) {
    alert(e?.message || "Не удалось сохранить");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <div class="pageHeader">
      <div class="headerLeft">
        <button @click="goBack" class="backBtn">← Назад</button>
        <h1>{{ warehouse?.name || "Склад" }}</h1>
      </div>
      <div class="actions">
        <button
          v-if="permissions.canEditNomenclature"
          class="btn"
          type="button"
          @click="openEdit"
        >
          Редактировать
        </button>
        <button
          v-if="permissions.canEditNomenclature"
          class="btn"
          type="button"
          style="margin-left: 8px; background: #ff6b6b; color: white"
          @click="confirmDeleteWarehouse"
        >
          Удалить
        </button>
      </div>
    </div>

    <ModalForm v-model="showEdit" title="Редактировать склад">
      <div>
        <FormField
          label="Название"
          v-model="formModel.name"
          placeholder="Название склада"
        />
        <FormField
          label="Адрес"
          type="textarea"
          v-model="formModel.address"
          placeholder="улица, дом"
        />
        <FormField
          label="Вместимость"
          v-model="formModel.capacity"
          placeholder="число (например, 500)"
        />
      </div>

      <template #footer>
        <button class="btn" type="button" @click="showEdit = false">
          Отмена
        </button>
        <button
          class="btn btnPrimary"
          type="button"
          @click="submitEdit"
          :disabled="saving"
        >
          {{ saving ? "Сохраняю..." : "Сохранить" }}
        </button>
      </template>
    </ModalForm>

    <div v-if="loading" class="loading">Загрузка...</div>

    <div v-else-if="warehouse" class="content">
      <div class="card infoCard">
        <h3>Информация</h3>
        <div class="infoGrid">
          <div class="infoItem">
            <span class="label">Адрес:</span>
            <span class="value">{{ warehouse.address || "—" }}</span>
          </div>
          <div class="infoItem">
            <span class="label">Вместимость:</span>
            <span class="value">{{ warehouse.capacity ?? "—" }}</span>
          </div>
        </div>
      </div>
      <div class="statsGrid">
        <div class="statCard">
          <div class="statLabel">Всего позиций</div>
          <div class="statValue">
            {{ warehouse.stats?.totalItems ?? "—" }}
          </div>
        </div>
        <div class="statCard">
          <div class="statLabel">Загруженность</div>
          <div class="statValue">{{ warehouse.stats?.occupancy ?? "—" }}%</div>
        </div>
      </div>

      <div class="grid2col">
        <div class="card">
          <h3>Остатки на складе</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Номенклатура</th>
                <th>Всего</th>
                <th>Резерв</th>
                <th>Доступно</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="stockLoading">
                <td colspan="4">Загрузка остатков…</td>
              </tr>
              <tr v-else v-for="item in stock" :key="item.itemId || item.id">
                <td>{{ item.itemName || item.name || item.code || "-" }}</td>
                <td>{{ item.quantity ?? "0" }}</td>
                <td>{{ item.reserved ?? "0" }}</td>
                <td>
                  {{
                    item.available ??
                    (item.quantity ?? 0) - (item.reserved ?? 0)
                  }}
                </td>
              </tr>
              <tr v-if="!stockLoading && stock.length === 0">
                <td colspan="4">Нет остатков</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <h3>Последние документы</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Номер</th>
                <th>Тип</th>
                <th>Дата</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="docsLoading">
                <td colspan="4">Загрузка документов…</td>
              </tr>
              <tr v-else-if="recentDocuments.length === 0">
                <td colspan="4">Нет документов</td>
              </tr>
              <tr v-else v-for="doc in recentDocuments" :key="doc.id">
                <td>
                  <router-link :to="`/documents/${doc.id}`" class="link">{{
                    doc.number
                  }}</router-link>
                </td>
                <td>{{ doc.type }}</td>
                <td>{{ doc.date }}</td>
                <td>{{ doc.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <ModalForm v-model="showDelete" title="Подтвердите удаление">
      <div>
        <p>
          Вы действительно хотите удалить склад "{{ warehouse?.name }}"? Это
          действие удалит локальные локальные данные.
        </p>
      </div>
      <template #footer>
        <button class="btn" type="button" @click="showDelete = false">
          Отмена
        </button>
        <button
          class="btn"
          type="button"
          style="background: #ff6b6b; color: white"
          @click="performDeleteWarehouse"
          :disabled="deleting"
        >
          {{ deleting ? "Удаляю..." : "Удалить" }}
        </button>
      </template>
    </ModalForm>
  </div>
</template>

<style scoped>
.pageHeader {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-4);
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.backBtn {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.statsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-3);
}

.statCard {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-3);
}

.statLabel {
  color: var(--muted);
  font-size: 0.9rem;
}

.statValue {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 4px;
}

.grid2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-4);
}

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

.link {
  color: #646cff;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
