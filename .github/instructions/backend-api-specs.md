# Backend API Specification

This document outlines the REST API endpoints required to support the WMS University frontend.
All endpoints should be prefixed with `/api` (or configured via base URL).

## Common Types

```typescript
type UserRole = "manager" | "storeKeeper";
type ItemType = "material" | "product";
type DocumentType = "incoming" | "transfer" | "production";
type DocumentStatus = "draft" | "completed" | "cancelled";
type DocumentItemDirection = "in" | "out";
```

## 1. Auth Module

### Login

-   **POST** `/auth/login`
-   **Body**: `{ login: string, password: string }`
-   **Response**: `void` (Sets `sessionId` HttpOnly cookie)

### Get Current User

-   **GET** `/auth/me`
-   **Response**:

```typescript
{
  id: string; // UUID
  login: string;
  firstname: string;
  lastname: string;
  middlename?: string;
  role: UserRole;
}
```

### Logout

-   **POST** `/auth/logout`
-   **Response**: `void` (Clears cookie)

## 2. Stats Module (Dashboard)

### Warehouse Utilization

Used for the "Warehouse Utilization" chart.

-   **GET** `/stats/warehouse-utilization`
-   **Response**:

```typescript
Array<{
	id: number;
	name: string;
	capacity: number;
	currentCount: number;
}>;
```

### Daily Movements

Used for the "Documents — 14 days" chart.

-   **GET** `/stats/daily-movements`
-   **Query**: `days` (optional, default 14)
-   **Response**:

```typescript
Array<{
	date: string; // YYYY-MM-DD
	incoming: number;
	transfer: number;
	production: number;
}>;
```

### Low Stock Items

Used for the "Items below minimum" chart.

-   **GET** `/stats/low-stock`
-   **Response**:

```typescript
Array<{
	id: number;
	name: string;
	current: number; // Current quantity across all warehouses
	min: number; // Min quantity threshold
}>;
```

## 3. Suppliers Module

### List Suppliers

-   **GET** `/suppliers`
-   **Response**:

```typescript
Array<{
	id: number;
	name: string;
	inn: string | null;
	contactPerson: string | null;
	phone: string | null;
	email: string | null;
	address: string | null;
	createdAt: number; // Timestamp
	updatedAt: number; // Timestamp
}>;
```

### Get Supplier

-   **GET** `/suppliers/:id`
-   **Response**: `Supplier` (same object as in list)

### Create Supplier

-   **POST** `/suppliers`
-   **Body**:

```typescript
{
  name: string;
  inn?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}
```

-   **Response**: `Supplier`
-   **Permissions**: Manager only.

### Update Supplier

-   **PATCH** `/suppliers/:id`
-   **Body**: Partial `Supplier` fields.
-   **Response**: `Supplier`
-   **Permissions**: Manager only.

### Delete Supplier

-   **DELETE** `/suppliers/:id`
-   **Response**: `void`
-   **Permissions**: Manager only.

## 4. Nomenclature Module (Items)

### List Items

-   **GET** `/nomenclature`
-   **Response**:

```typescript
Array<{
	id: number;
	code: string;
	name: string;
	type: ItemType;
	unit: string;
	purchasePrice: string | null; // Decimal as string
	sellPrice: string | null; // Decimal as string
	minQuantity: string; // Decimal as string
	description: string | null;
	createdAt: number;
	updatedAt: number;
}>;
```

### Get Item

-   **GET** `/nomenclature/:id`
-   **Response**: `Item` (same object as in list)

### Create Item

-   **POST** `/nomenclature`
-   **Body**:

```typescript
{
  code: string;
  name: string;
  type: ItemType;
  unit: string;
  minQuantity: string;
  purchasePrice?: string;
  sellPrice?: string;
  description?: string;
}
```

-   **Response**: `Item`
-   **Permissions**: Manager only.

### Update Item

-   **PATCH** `/nomenclature/:id`
-   **Body**: Partial `Item` fields.
-   **Response**: `Item`
-   **Permissions**: Manager only.

### Delete Item

-   **DELETE** `/nomenclature/:id`
-   **Response**: `void`
-   **Permissions**: Manager only.

## 5. Warehouses Module

### List Warehouses

-   **GET** `/warehouses`
-   **Response**:

```typescript
Array<{
	id: number;
	name: string;
	address: string | null;
	capacity?: number;
}>;
```

### Get Warehouse

-   **GET** `/warehouses/:id`
-   **Response**: `Warehouse`

### Create Warehouse

-   **POST** `/warehouses`
-   **Body**: `{ name: string, address?: string, capacity?: number }`
-   **Response**: `Warehouse`
-   **Permissions**: Manager only.

### Update Warehouse

-   **PATCH** `/warehouses/:id`
-   **Body**: `{ name?: string, address?: string, capacity?: number }`
-   **Response**: `Warehouse`
-   **Permissions**: Manager only.

### Delete Warehouse

-   **DELETE** `/warehouses/:id`
-   **Response**: `void`
-   **Permissions**: Manager only.

## 6. Documents Module

### List Documents

-   **GET** `/documents`
-   **Query**:
    -   `type` (optional): DocumentType
    -   `status` (optional): DocumentStatus
    -   `dateFrom` (optional): YYYY-MM-DD
    -   `dateTo` (optional): YYYY-MM-DD
-   **Response**:

```typescript
Array<{
	id: number;
	number: string;
	type: DocumentType;
	status: DocumentStatus;
	date: string; // YYYY-MM-DD
	warehouseFromId?: number | null;
	warehouseToId?: number | null;
	supplierId?: number | null;
	author?: {
		id: string;
		login: string;
		firstname: string;
		lastname: string;
	};
}>;
```

### Get Document Detail

-   **GET** `/documents/:id`
-   **Response**:

```typescript
{
  // ... fields from List Item
  userId: string; // Author ID
  comment?: string;

  // Expanded relations for UI display
  supplier?: { id: number; name: string };
  warehouseFrom?: { id: number; name: string };
  warehouseTo?: { id: number; name: string };

  items: Array<{
    id?: number;
    itemId: number;
    quantity: string;
    direction?: "in" | "out";
    price?: string; // Purchase price snapshot

    // Expanded item info
    item: {
      id: number;
      code: string;
      name: string;
      unit: string;
    };
  }>;
}
```

### Create Document

-   **POST** `/documents`
-   **Body**:

```typescript
{
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
```

-   **Response**: `DocumentDetail`

### Cancel Document

-   **PATCH** `/documents/:id/cancel`
-   **Response**: `DocumentDetail` (with status 'cancelled')
-   **Permissions**: Manager only.

## 7. Stock Module

### Get Stock Balance

-   **GET** `/stock`
-   **Query**: `warehouseId` (optional)
-   **Response**:

```typescript
Array<{
	warehouseId: number;
	warehouseName: string; // Joined for convenience
	itemId: number;
	itemName: string; // Joined for convenience
	quantity: string; // Decimal
	reserved: string; // Decimal
	available: string; // Decimal
}>;
```

### Adjust Stock

-   **POST** `/stock/adjust`
-   **Body**:

```typescript
{
	warehouseId: number;
	itemId: number;
	quantity: string; // Amount to adjust by
	type: "increase" | "decrease";
	reason: string;
}
```

-   **Response**: `void`
-   **Permissions**: Manager only.
