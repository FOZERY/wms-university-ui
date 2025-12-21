import { http } from "./http";
import type { Supplier } from "./types";

export type SuppliersListQuery = {
	limit?: number;
	offset?: number;
	search?: string;
	// sort object, e.g. { name: 'asc', id: 'desc' }
	sort?: Record<string, 'asc' | 'desc'>;
};

export const suppliersApi = {
	async list(query?: SuppliersListQuery): Promise<Supplier[]> {
		const { data } = await http.get<Supplier[]>("/suppliers", {
			params: query,
		});
		return data;
	},

	async getById(id: number): Promise<Supplier> {
		const { data } = await http.get<Supplier>(`/suppliers/${id}`);
		return data;
	},
	async create(payload: { name: string; inn?: string; contactPerson?: string; phone?: string; email?: string; address?: string }): Promise<{ id: number }> {
		const { data } = await http.post<{ id: number }>(`/suppliers`, payload);
		return data;
	},
	async patch(id: number, payload: { name?: string; inn?: string; contactPerson?: string; phone?: string; email?: string; address?: string }): Promise<Supplier> {
		const { data } = await http.patch<Supplier>(`/suppliers/${id}`, payload);
		return data;
	},
	async delete(id: number): Promise<void> {
		await http.delete(`/suppliers/${id}`);
	},
};
