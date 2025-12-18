import { defineStore } from "pinia";
import type { MeResponse, UserRole } from "../shared/api/types";

type LoadState = "idle" | "loading" | "loaded" | "error";

const LS_KEY = "wms.mock.role";

function buildMockMe(role: UserRole): MeResponse {
	if (role === "manager") {
		const firstname = "Иван";
		const lastname = "Петров";
		const middlename = "Иванович";
		return {
			id: "00000000-0000-0000-0000-000000000001",
			login: `${firstname.toLowerCase()}.${lastname.toLowerCase()}`,
			firstname,
			lastname,
			middlename,
			role,
		};
	}

	// storeKeeper
	const firstname = "Пётр";
	const lastname = "Сидоров";
	const middlename = "Сергеевич";
	return {
		id: "00000000-0000-0000-0000-000000000002",
		login: `${firstname.toLowerCase()}.${lastname.toLowerCase()}`,
		firstname,
		lastname,
		middlename,
		role,
	};
}

function readRoleFromStorage(): UserRole | null {
	const raw = localStorage.getItem(LS_KEY);
	if (raw === "manager" || raw === "storeKeeper") return raw;
	return null;
}

export const useAuthStore = defineStore("auth", {
	state: () => ({
		me: null as MeResponse | null,
		state: "idle" as LoadState,
		error: null as string | null,
	}),

	getters: {
		isAuthenticated: (s) => Boolean(s.me),
		role: (s) => s.me?.role ?? null,
	},

	actions: {
		async ensureMeLoaded(): Promise<void> {
			if (this.state === "loaded" || this.state === "loading") return;
			this.state = "loading";

			const role = readRoleFromStorage();
			this.me = role ? buildMockMe(role) : null;

			this.state = "loaded";
		},

		selectRole(role: UserRole): void {
			localStorage.setItem(LS_KEY, role);
			this.me = buildMockMe(role);
			this.state = "loaded";
			this.error = null;
		},

		logout(): void {
			localStorage.removeItem(LS_KEY);
			this.me = null;
			this.state = "idle";
			this.error = null;
		},
	},
});
