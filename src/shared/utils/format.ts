export function mapItemTypeToRu(type?: string) {
  if (!type) return "-";
  if (type === "material") return "Материал";
  if (type === "product") return "Готовая продукция";
  return String(type);
}

export function mapRoleToRu(role?: string) {
  if (!role) return "-";
  if (role === "manager") return "Менеджер";
  if (role === "storeKeeper") return "Кладовщик";
  return String(role);
}

export function mapDocumentTypeToRu(type?: string) {
  if (!type) return "-";
  if (type === "incoming") return "Приходный ордер";
  if (type === "transfer") return "Перемещение";
  if (type === "production") return "Производство";
  return String(type);
}

export function mapDocumentStatusToRu(status?: string) {
  if (!status) return "-";
  if (status === "draft") return "Черновик";
  if (status === "completed") return "Проведён";
  if (status === "cancelled") return "Отменён";
  return String(status);
}

export default {
  mapItemTypeToRu,
  mapRoleToRu,
  mapDocumentTypeToRu,
  mapDocumentStatusToRu,
};
