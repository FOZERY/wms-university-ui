import { http } from './http';
import type { WarehouseUtilization, DailyMovement, LowStockItem } from './types';

export const statsApi = {
  async getWarehouseUtilization(queries?: { limit?: number; offset?: number; breakdown?: 'none' | 'type' }) {
    const resp = await http.get('/stats/warehouse-utilization', { params: queries });
    const d = (resp && (resp as any).data) || resp;
    if (Array.isArray(d)) return d as WarehouseUtilization[];
    if (d && Array.isArray(d.data)) return d.data as WarehouseUtilization[];
    if (d && Array.isArray(d.items)) return d.items as WarehouseUtilization[];
    // handle backend that returns object with overall/summary arrays
    if (d && Array.isArray(d.overall)) return d.overall as WarehouseUtilization[];
    if (d && Array.isArray(d.summary)) return d.summary as WarehouseUtilization[];
    return [] as WarehouseUtilization[];
  },

  async getDailyMovements(params?: { days?: number; dateFrom?: string; dateTo?: string }) {
    const resp = await http.get('/stats/daily-movements', { params });
    const d = (resp && (resp as any).data) || resp;
    if (Array.isArray(d)) return d as DailyMovement[];
    if (d && Array.isArray(d.data)) return d.data as DailyMovement[];
    if (d && Array.isArray(d.items)) return d.items as DailyMovement[];
    return [] as DailyMovement[];
  },

  async getLowStock(queries?: { limit?: number; warehouseId?: number; onlyBelow?: boolean }) {
    const resp = await http.get('/stats/low-stock', { params: queries });
    const d = (resp && (resp as any).data) || resp;
    if (Array.isArray(d)) return d as LowStockItem[];
    if (d && Array.isArray(d.data)) return d.data as LowStockItem[];
    if (d && Array.isArray(d.items)) return d.items as LowStockItem[];
    return [] as LowStockItem[];
  },
};

export default statsApi;
