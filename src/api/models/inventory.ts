export interface UpdateInventoryRequest {
  /** Integer, from 0 to 1000000 inclusive. */
  quantity: number;
  /** Integer, minimum 1. */
  version: number;
}

/** PATCH /api/v1/inventory/{sku} - 200. */
export interface InventoryLevel {
  id: string;
  sku: string;
  name: string;
  stock: number;
  version: number;
  updatedAt: string;
}
