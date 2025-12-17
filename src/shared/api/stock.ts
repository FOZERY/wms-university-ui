import { http } from "./http";
import type { StockBalance } from "./types";

export const stockApi = {
	getAll: (params?: any) => http.get<StockBalance[]>("/stock", { params }),
	getByItem: (itemId: number | string) =>
		http.get<StockBalance[]>(`/stock/${itemId}`),
	adjust: (data: any) => http.post("/stock/adjust", data),
};
