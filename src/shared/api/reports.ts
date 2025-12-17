import { http } from "./http";

export const reportsApi = {
	getLowStock: () => http.get<any[]>("/reports/stock/low"),
	getMovement: (params?: any) =>
		http.get<any[]>("/reports/movement", { params }),
};
