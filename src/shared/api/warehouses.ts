import { http } from "./http";
import type { Warehouse } from "./types";

export type WarehousesListQuery = {
	limit?: number;
	offset?: number;
	search?: string;
};

export const warehousesApi = {
	async list(query?: WarehousesListQuery): Promise<Warehouse[]> {
		const { data } = await http.get<Warehouse[]>('/warehouses', { params: query });
		return data;
	},

	async getById(id: number | string): Promise<Warehouse> {
		const { data } = await http.get<Warehouse>(`/warehouses/${id}`);
		return data;
	},

	async create(payload: { name: string; address?: string; capacity?: number }): Promise<{ id: number }> {
		const { data } = await http.post<{ id: number }>('/warehouses', payload);
		return data;
	},

	async patch(id: number | string, payload: Partial<Warehouse>): Promise<Warehouse> {
		const { data } = await http.patch<Warehouse>(`/warehouses/${id}`, payload);
		return data;
	},

	async delete(id: number | string): Promise<void> {
		await http.delete(`/warehouses/${id}`);
	}
};
