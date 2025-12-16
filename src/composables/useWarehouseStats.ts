import { ref } from "vue";
import { mockWarehouseStats } from "../shared/mocks/data";

export function useWarehouseStats() {
  const data = ref([...mockWarehouseStats]);
  const loading = ref(false);

  async function refresh() {
    loading.value = true;
    // placeholder: in real app fetch from API
    await new Promise((r) => setTimeout(r, 200));
    data.value = [...mockWarehouseStats];
    loading.value = false;
  }

  return { data, loading, refresh };
}
