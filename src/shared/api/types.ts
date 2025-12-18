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
	address: string | null;
	/** Вместимость склада, в условных единицах (процент или количество) */
	capacity?: number;
}

export interface LoginRequest {
	login: string;
	password: string;
}

// Documents
export type DocumentType = "incoming" | "transfer" | "production";
export type DocumentStatus = "draft" | "completed" | "cancelled";

export interface DocumentListItem {
	id: number;
	number: string;
	type: DocumentType;
	status: DocumentStatus;
	date: string;
	warehouseFromId?: number | null;
	warehouseToId?: number | null;
	supplierId?: number | null;
}

export interface DocumentItem {
	id?: number;
	itemId: number;
	quantity: string;
	direction?: "in" | "out";
}

export interface DocumentDetail extends DocumentListItem {
	userId: string;
	comment?: string;
	items: DocumentItem[];
}

export interface CreateDocumentRequest {
	type: DocumentType;
	date?: string;
	warehouseFromId?: number | null;
	warehouseToId?: number | null;
	supplierId?: number | null;
	comment?: string;
	items: Array<{
		itemId: number;
		quantity: string;
		direction?: "in" | "out";
	}>;
}

// Stock
export interface StockBalance {
	itemId: number;
	warehouseId: number;
	quantity: string;
	reserved: string;
	available: string;
}
