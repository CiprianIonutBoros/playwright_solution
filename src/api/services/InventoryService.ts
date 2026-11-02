import type { InventoryApi } from '../clients/InventoryApi';
import type { InventoryLevel } from '../models/inventory';
import { readJson } from './serviceResponse';

export class InventoryService {
  constructor(private readonly api: InventoryApi) {}

  /** PATCH /api/v1/inventory/{sku} - 200. `version` must match the product's current version. */
  async setStock(sku: string, quantity: number, version: number, accessToken: string): Promise<InventoryLevel> {
    return readJson<InventoryLevel>(
      await this.api.update(sku, { quantity, version }, accessToken), 200, 'Set stock',
    );
  }
}
