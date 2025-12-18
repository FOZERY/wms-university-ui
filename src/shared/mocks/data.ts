import type { Item, Supplier, UserRole } from "../api/types";

export type Warehouse = {
	id: number;
	name: string;
	address: string | null;
	capacity?: number;
};

export type StockRow = {
	warehouseId: number;
	warehouseName: string;
	itemId: number;
	itemName: string;
	quantity: string;
	reserved: string;
	available: string;
};

export type DocumentStatus = "draft" | "completed" | "cancelled";
export type DocumentType = "incoming" | "transfer" | "production";

export type DocumentListItem = {
	id: number;
	number: string;
	type: DocumentType;
	status: DocumentStatus;
	date: string; // YYYY-MM-DD
	authorLogin: string;
	authorRole: UserRole;
};

export const mockItems: Item[] = [
	{
		id: 1,
		code: "MAT-001",
		name: "Сталь листовая",
		type: "material",
		unit: "кг",
		purchasePrice: "98.50",
		sellPrice: null,
		minQuantity: "50.000",
		description: "Материал для производства",
		createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
		updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
	},
	{
		id: 2,
		code: "PRD-100",
		name: "Тележка Т-100",
		type: "product",
		unit: "шт",
		purchasePrice: null,
		sellPrice: "12500.00",
		minQuantity: "2.000",
		description: null,
		createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
		updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
	},
	{
		id: 3,
		code: "MAT-002",
		name: "Болт М8",
		type: "material",
		unit: "шт",
		purchasePrice: "3.20",
		sellPrice: null,
		minQuantity: "200.000",
		description: null,
		createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
		updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
	},
];

export const mockSuppliers: Supplier[] = [
	{
		id: 10,
		name: "ООО МеталлТрейд",
		inn: "7701234567",
		contactPerson: "Иванов И.И.",
		phone: "+7 (900) 000-00-00",
		email: "sales@metaltrade.test",
		address: "Москва, ул. Примерная, 1",
		createdAt: Date.now() - 1000 * 60 * 60 * 24 * 120,
		updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
	},
	{
		id: 11,
		name: "ЗАО КрепёжСнаб",
		inn: "7812345678",
		contactPerson: "Петров П.П.",
		phone: null,
		email: "info@krep.test",
		address: null,
		createdAt: Date.now() - 1000 * 60 * 60 * 24 * 200,
		updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
	},
];

export const mockWarehouses: Warehouse[] = [
	{ id: 1, name: "Основной", address: "Цех 1", capacity: 500 },
	{ id: 2, name: "Готовая продукция", address: "Цех 2", capacity: 200 },
	{ id: 3, name: "Сырьё", address: null, capacity: 1000 },
];

export type WarehouseStats = {
	id: number;
	name: string;
	capacity: number;
	currentCount: number;
};

export const mockWarehouseStats: WarehouseStats[] = [
	{ id: 1, name: "Основной", capacity: 500, currentCount: 320 },
	{ id: 2, name: "Готовая продукция", capacity: 200, currentCount: 185 },
	{ id: 3, name: "Сырьё", capacity: 1000, currentCount: 420 },
	{ id: 4, name: "Комплектующие", capacity: 300, currentCount: 95 },
];

export const mockStock: StockRow[] = [
	{
		warehouseId: 1,
		warehouseName: "Основной",
		itemId: 1,
		itemName: "Сталь листовая",
		quantity: "120.000",
		reserved: "5.000",
		available: "115.000",
	},
	{
		warehouseId: 2,
		warehouseName: "Готовая продукция",
		itemId: 2,
		itemName: "Тележка Т-100",
		quantity: "8.000",
		reserved: "1.000",
		available: "7.000",
	},
];

export type StockAdjustment = {
	id: number;
	userId: string | null;
	warehouseId: number;
	itemId: number;
	delta: number; // positive = increase, negative = decrease
	reason: string;
	referenceDocument?: string | null;
	createdAt: number;
};

export const mockAdjustments: StockAdjustment[] = [];

export const mockDocuments: DocumentListItem[] = [
	{
		id: 1,
		number: "ПР-0001",
		type: "incoming",
		status: "draft",
		date: "2025-12-13",
		authorLogin: "storeKeeper",
		authorRole: "storeKeeper",
	},
	{
		id: 2,
		number: "ПР-0002",
		type: "transfer",
		status: "completed",
		date: "2025-12-12",
		authorLogin: "manager",
		authorRole: "manager",
	},
	{
		id: 3,
		number: "ПР-0003",
		type: "incoming",
		status: "completed",
		date: "2025-12-11",
		authorLogin: "storeKeeper",
		authorRole: "storeKeeper",
	},
];
