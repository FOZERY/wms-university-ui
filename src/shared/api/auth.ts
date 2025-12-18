import { http } from "./http";
import type { LoginRequest, MeResponse } from "./types";

export const authApi = {
	async login(payload: LoginRequest): Promise<void> {
		await http.post("/auth/login", payload);
	},

	async logout(): Promise<void> {
		await http.post("/auth/logout");
	},

	async me(): Promise<MeResponse> {
		const { data } = await http.get<MeResponse>("/auth/me");
		return data;
	},
};
