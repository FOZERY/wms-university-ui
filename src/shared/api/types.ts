export type UserRole = "manager" | "storeKeeper";

export type ItemType = "material" | "product";

export interface MeResponse {
	id: string;
	login: string;
	firstname: string;
	lastname: string;
	middlename?: string;
	role: UserRole;
}

export interface Supplier {
	id: number;
	name: string;
	inn: string | null;
	contactPerson: string | null;
	phone: string | null;
	email: string | null;
	address: string | null;
	createdAt: number;
	updatedAt: number;
}

export interface Item {
	id: number;
	code: string;
	name: string;
	type: ItemType;
	unit: string;
	purchasePrice: string | null;
	sellPrice: string | null;
	minQuantity: string;
	description: string | null;
	createdAt: number;
	updatedAt: number;
}

export interface Warehouse {
	id: number;
	name: string;
	address?: string;
}

export interface LoginRequest {
	login: string;
	password: string;
}
