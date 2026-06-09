import { useState, useCallback } from 'react';
import { Sale, CreateSaleRequest } from '../types';
import { apiService } from '../services/api';

export const useSales = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allSales, setAllSales] = useState<Sale[]>([]);

  const createSale = async (saleData: CreateSaleRequest): Promise<Sale> => {
    setLoading(true);
    setError(null);
    try {
      const sale = await apiService.createSale(saleData);
      return sale;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process sale';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSales = async (page: number = 1, limit: number = 50) => {
    setLoading(true);
    setError(null);
    try {
      return await apiService.getSales(page, limit);
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
      let sales: Sale[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await apiService.getSales(page, 100);
        
        if (response.data && response.data.length > 0) {
          sales = [...sales, ...response.data];
          hasMore = page < response.pagination.totalPages;
          page++;
        } else {
          hasMore = false;
        }
      }

      setAllSales(sales);
      return sales;
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
      return await apiService.getTodaySales();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch today sales';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSalesByDate = useCallback(async (date: string): Promise<Sale[]> => {
    try {
      const sales = await apiService.getSalesByDate(date);
      return sales;
    } catch (error) {
      console.error('Admin date filter failed, using fallback:', error);
      
      const filtered = allSales.filter(sale => {
        if (!sale.created_at) return false;
        const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
        return saleDate === date;
      });
      
      return filtered;
    }
  }, [allSales]);

  return {
    loading,
    error,
    createSale,
    getSales,
    getAllSales,  
    getTodaySales,
    getSalesByDate,
  };
};