
import { JobOrder } from '../types';

const STORAGE_KEY = 'halagel_job_orders_db';

export const StorageService = {
  getAllOrders: (): JobOrder[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const orders = JSON.parse(data);
      return orders as JobOrder[];
    } catch (e) {
      console.error("Failed to load orders", e);
      return [];
    }
  },

  getOrderById: (id: string): JobOrder | undefined => {
    const orders = StorageService.getAllOrders();
    return orders.find(o => o.id === id);
  },

  createOrder: (order: JobOrder): void => {
    const orders = StorageService.getAllOrders();
    orders.push(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  },

  updateOrder: (updatedOrder: JobOrder): void => {
    const orders = StorageService.getAllOrders();
    const index = orders.findIndex(o => o.id === updatedOrder.id);
    if (index !== -1) {
      orders[index] = updatedOrder;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }
  },

  // Helper for generating ID
  generateId: (): string => {
    return Math.random().toString(36).substr(2, 9);
  }
};
