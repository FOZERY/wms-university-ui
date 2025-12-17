import { http } from "./http";
import type { Warehouse } from "./types";

export const warehousesApi = {
	getAll: () => http.get<Warehouse[]>("/warehouses"),
	getById: (id: number | string) => http.get<Warehouse>(`/warehouses/${id}`),
	create: (data: Partial<Warehouse>) =>
		http.post<Warehouse>("/warehouses", data),
	update: (id: number | string, data: Partial<Warehouse>) =>
		http.put<Warehouse>(`/warehouses/${id}`, data),
};
