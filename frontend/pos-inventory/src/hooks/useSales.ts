import { useState } from 'react';
import { Sale } from '../types';
import { apiService } from '../services/api';

export const useSales = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSales = async (page: number = 1, limit: number = 50) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getCashierSales(page, limit);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sales';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAllSales = async (): Promise<Sale[]> => {
    setLoading(true);
    setError(null);
    try {
      let allSales: Sale[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await apiService.getCashierSales(page, 100);
        
        if (response.data && response.data.length > 0) {
          allSales = [...allSales, ...response.data];
          hasMore = page < response.pagination.totalPages;
          page++;
        } else {
          hasMore = false;
        }
      }

      return allSales;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch all sales';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTodaySales = async () => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.getCashierTodaySales();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch today sales';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSalesByDate = async (date: string): Promise<Sale[]> => {
    try {
      const sales = await apiService.getCashierSalesByDate(date);
      return sales;
    } catch (error) {
      console.error('Cashier date filter failed, using fallback:', error);
      
      const allSales = await getAllSales();
      const filtered = allSales.filter(sale => {
        if (!sale.created_at) return false;
        const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
        return saleDate === date;
      });
      
      return filtered;
    }
  };

  return {
    loading,
    error,
    getSales,
    getAllSales,  
    getTodaySales,
    getSalesByDate,
  };
};