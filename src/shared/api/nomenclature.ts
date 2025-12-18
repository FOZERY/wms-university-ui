import { http } from "./http";
import type { Item } from "./types";

export type NomenclatureListQuery = {
	limit?: number;
	offset?: number;
	name?: string;
	code?: string;
	type?: Item["type"];
};

export const nomenclatureApi = {
	async list(query?: NomenclatureListQuery): Promise<Item[]> {
		const { data } = await http.get<Item[]>("/nomenclature", { params: query });
		return data;
	},

	async getById(id: number): Promise<Item> {
		const { data } = await http.get<Item>(`/nomenclature/${id}`);
		return data;
	},
};
