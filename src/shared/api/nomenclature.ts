import { http } from "./http";
import type { Item } from "./types";

// Query shape used by the frontend to call the backend listing endpoint.
// Supports pagination, free-text search, type filter and server-side sort.
export type NomenclatureListQuery = {
	limit?: number;
	offset?: number;
	// optional free-text search applied on code/name on the server
	search?: string;
	// sort object like { name: 'asc' } - axios will serialize it as sort[name]=asc
	sort?: Record<string, "asc" | "desc">;
	type?: Item["type"];
};

export const nomenclatureApi = {
	async list(query?: NomenclatureListQuery): Promise<Item[]> {
		const { data } = await http.get<Item[]>("/nomenclature", {
			params: query,
		});
		return data;
	},

	async getById(id: number): Promise<Item> {
		const { data } = await http.get<Item>(`/nomenclature/${id}`);
		return data;
	},
	async create(payload: {
		code: string;
		name: string;
		unit: string;
		type: Item['type'];
		purchasePrice?: string | null;
		sellPrice?: string | null;
		minQuantity?: string;
		description?: string | null;
	}): Promise<{ id: number }> {
		const { data } = await http.post<{ id: number }>(`/nomenclature`, payload);
		return data;
	},

	async patch(id: number | string, payload: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Item> {
		const { data } = await http.patch<Item>(`/nomenclature/${id}`, payload as any);
		return data;
	},
	async delete(id: number | string): Promise<void> {
		await http.delete(`/nomenclature/${id}`);
	},
};
