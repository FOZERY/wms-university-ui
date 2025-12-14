import { http } from './http';
import type { Supplier } from './types';

export type SuppliersListQuery = {
  limit?: number;
  offset?: number;
  name?: string;
};

export const suppliersApi = {
  async list(query?: SuppliersListQuery): Promise<Supplier[]> {
    const { data } = await http.get<Supplier[]>('/suppliers', { params: query });
    return data;
  },

  async getById(id: number): Promise<Supplier> {
    const { data } = await http.get<Supplier>(`/suppliers/${id}`);
    return data;
  },
};
