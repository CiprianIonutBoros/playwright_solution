import { randomUUID } from 'node:crypto';
import type { RegisterRequest } from '../../api/models/auth';
import { createRandomShippingAddress } from './shippingAddress';

// DemoShop's published seed account for the local training environment.
export const validUser = {
  email: 'ava.customer@example.test',
  password: 'Shopper123!',
} as const;

export const validAdminUser = {
  email: 'alex.admin@example.test',
  password: 'Admin123!',
} as const;

const seedCreatedAt = '2026-10-01T14:35:18.171Z';

/** Seed accounts as GET /api/v1/admin/users lists them, ordered by id. */
export const seedUsers = [
  { id: '00000000-0000-4000-8000-000000000101', email: 'ava.customer@example.test', fullName: 'Ava Customer', role: 'customer', createdAt: seedCreatedAt },
  { id: '00000000-0000-4000-8000-000000000102', email: 'ben.customer@example.test', fullName: 'Ben Customer', role: 'customer', createdAt: seedCreatedAt },
  { id: '00000000-0000-4000-8000-000000000201', email: 'sam.support@example.test', fullName: 'Sam Support', role: 'support_agent', createdAt: seedCreatedAt },
  { id: '00000000-0000-4000-8000-000000000202', email: 'ivy.inventory@example.test', fullName: 'Ivy Inventory', role: 'inventory_manager', createdAt: seedCreatedAt },
  { id: '00000000-0000-4000-8000-000000000203', email: 'alex.admin@example.test', fullName: 'Alex Administrator', role: 'store_admin', createdAt: seedCreatedAt },
] as const;

/** Seed records of the shared customer (validUser) and admin (validAdminUser). */
export const seedCustomer = seedUsers[0];
export const seedAdmin = seedUsers[4];

export const invalidPass = {
  email: 'ava.customer@example.test',
  password: 'Test123!',
} as const;

/** Only newly registered accounts: shared setup sessions must never be mutated. */
export function newAccount(): RegisterRequest {
  const id = randomUUID();
  return {
    email: validUser.email.replace('@', `+api-${id}@`),
    password: validUser.password,
    fullName: `${validUser.email.split('@')[0]} ${id}`,
    address: createRandomShippingAddress(),
  };
}
