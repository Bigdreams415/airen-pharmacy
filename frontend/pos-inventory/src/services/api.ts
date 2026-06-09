import { Product, Sale, CreateSaleRequest, TodaySalesSummary } from '../types';
import { DashboardSummary, SalesTrend, CategoryDistribution, RecentSale, LowStockProduct } from '../types';

const API_BASE_URL = 'https://abra-store-project.onrender.com/api';

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          if (!endpoint.includes('/auth/verify-token')) {
            this.clearAuthData();
          }
          throw new Error('Unauthorized. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      return data.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Helper method to convert product data with proper number conversion
  private convertProductData(productData: any): Product {
    return {
      ...productData,
      buy_price: Number(productData.buy_price) || 0,
      sell_price: Number(productData.sell_price) || 0,
      stock: Number(productData.stock) || 0
    };
  }

  // Helper method to convert array of products
  private convertProductsArray(productsData: any[]): Product[] {
    return productsData.map(product => this.convertProductData(product));
  }

  // Helper method to convert sale data with proper number conversion
  private convertSaleData(saleData: any): Sale {
    return {
      ...saleData,
      total_amount: Number(saleData.total_amount) || 0,
      total_profit: Number(saleData.total_profit) || 0,
      // Convert nested items if they exist
      items: saleData.items?.map((item: any) => ({
        ...item,
        unit_sell_price: Number(item.unit_sell_price) || 0,
        unit_buy_price: Number(item.unit_buy_price) || 0,
        total_sell_price: Number(item.total_sell_price) || 0,
        item_profit: Number(item.item_profit) || 0,
        quantity: Number(item.quantity) || 0
      })) || []
    };
  }

  // Helper method to convert array of sales
  private convertSalesArray(salesData: any[]): Sale[] {
    return salesData.map(sale => this.convertSaleData(sale));
  }
  
  // Barcode endpoints
  async getProductByBarcode(barcode: string): Promise<Product> {
    const product = await this.request<any>(`/products/barcode/${encodeURIComponent(barcode)}`);
    return this.convertProductData(product);
  }

  async checkBarcodeExists(barcode: string): Promise<{ exists: boolean; product?: Product }> {
    try {
      const product = await this.getProductByBarcode(barcode);
      return { exists: true, product };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Product not found')) {
        return { exists: false };
      }
      throw error;
    }
  }

  // Product endpoints
  async getProducts(): Promise<Product[]> {
    const products = await this.request<any[]>('/products');
    return this.convertProductsArray(products);
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.request<any>(`/products/${id}`);
    return this.convertProductData(product);
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const newProduct = await this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return this.convertProductData(newProduct);
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const updatedProduct = await this.request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    return this.convertProductData(updatedProduct);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async searchProducts(query: string): Promise<Product[]> {
    const products = await this.request<any[]>(`/products/search?q=${encodeURIComponent(query)}`);
    return this.convertProductsArray(products);
  }

  // Sales endpoints 
  async createSale(saleData: CreateSaleRequest): Promise<Sale> {
    const sale = await this.request<any>('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
    return this.convertSaleData(sale);
  }
  async getSales(page: number = 1, limit: number = 50): Promise<{ data: Sale[]; pagination: any }> {
    const response = await this.request<any>(`/sales?page=${page}&limit=${limit}`);
    
    // Handle different response structures
    let salesData: any[] = [];
    
    if (Array.isArray(response)) {
      // If response is directly an array
      salesData = response;
    } else if (response && typeof response === 'object') {
      // If response has data property
      salesData = response.data || response.sales || [];
    }
    
    return {
      data: this.convertSalesArray(salesData),
      pagination: response.pagination || {}
    };
  }

  async getSaleById(id: string): Promise<Sale> {
    const sale = await this.request<any>(`/sales/${id}`);
    return this.convertSaleData(sale);
  }

  async getTodaySales(): Promise<{ sales: Sale[]; summary: TodaySalesSummary }> {
    const response = await this.request<any>('/sales/today');
    
    // Handle different response structures
    let salesData: any[] = [];
    let summaryData: TodaySalesSummary = response.summary || {};
    
    if (Array.isArray(response)) {
      salesData = response;
    } else if (response && typeof response === 'object') {
      salesData = response.sales || response.data || [];
      summaryData = response.summary || {};
    }
    
    return {
      sales: this.convertSalesArray(salesData),
      summary: summaryData
    };
  }

  async getSalesByDate(date: string): Promise<Sale[]> {
    const sales = await this.request<any[]>(`/sales/by-date?date=${date}`);
    return this.convertSalesArray(sales);
  }

  // Cashier sales by date
  async getCashierSalesByDate(date: string): Promise<Sale[]> {
    const sales = await this.request<any[]>(`/sales-history/by-date?date=${date}`);
    return this.convertSalesArray(sales);
  }
  
  // Health check
  async healthCheck(): Promise<{ message: string; timestamp: string }> {
    return this.request('/health');
  }

  // Dashboard endpoints
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>('/dashboard/summary');
  }

  async getSalesTrend(days: number = 7): Promise<SalesTrend> {
    return this.request<SalesTrend>(`/dashboard/sales-trend?days=${days}`);
  }

  async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    return this.request<CategoryDistribution[]>('/dashboard/categories');
  }

  async getRecentSales(limit: number = 5): Promise<RecentSale[]> {
    const sales = await this.request<any[]>(`/dashboard/recent-sales?limit=${limit}`);
    return sales.map(sale => ({
      ...sale,
      total_amount: Number(sale.total_amount) || 0
    }));
  }

  async getLowStockProducts(threshold: number = 10): Promise<LowStockProduct[]> {
    const products = await this.request<any[]>(`/dashboard/low-stock?threshold=${threshold}`);
    return this.convertProductsArray(products);
  }

  async getTotalStockWorth(): Promise<{ total_stock_worth: number }> {
    return this.request<{ total_stock_worth: number }>('/dashboard/stock-worth');
  }

  //cashier sales endpoints
  async getCashierSales(page: number = 1, limit: number = 50): Promise<{ data: Sale[]; pagination: any }> {
    const response = await this.request<any>(`/sales-history?page=${page}&limit=${limit}`);
    
    let salesData: any[] = [];
    
    if (Array.isArray(response)) {
      salesData = response;
    } else if (response && typeof response === 'object') {
      salesData = response.data || response.sales || [];
    }
    
    return {
      data: this.convertSalesArray(salesData),
      pagination: response.pagination || {}
    };
  }

  async getCashierTodaySales(): Promise<{ sales: Sale[]; summary: TodaySalesSummary }> {
    const response = await this.request<any>('/sales-history/today');
    
    let salesData: any[] = [];
    let summaryData: TodaySalesSummary = response.summary || {};
    
    if (Array.isArray(response)) {
      salesData = response;
    } else if (response && typeof response === 'object') {
      salesData = response.sales || response.data || [];
      summaryData = response.summary || {};
    }
    
    return {
      sales: this.convertSalesArray(salesData),
      summary: summaryData
    };
  }


  // Authentication
  async login(username: string, password: string): Promise<{ token: string; username: string }> {
    try {
      if (!username?.trim() || !password?.trim()) {
        throw new Error('Please provide both username and password');
      }

      const result = await this.request<{ token: string; username: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (result.token) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('username', result.username);
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('Invalid username or password. Please try again.');
        }
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          throw new Error('Unable to connect to server. Please check your connection.');
        }
      }
      throw new Error('Login failed. Please try again later.');
    }
  }

  async verifyToken(token?: string): Promise<{ valid: boolean; username?: string }> {
    try {
      const authToken = token || localStorage.getItem('authToken');

      console.log('🔐 verifyToken called, token from localStorage:', authToken ? `${authToken.substring(0, 20)}...` : 'No token');
      
      if (!authToken) {
        return { valid: false };
      }

      console.log('📤 Sending token in Authorization header...');
      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ token: authToken }),
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();
      console.log('✅ Verification response:', data);
      
      if (!data.success) {
        return { valid: false };
      }

      return data.data;
    } catch (error) {
      console.warn('Token verification failed:', error);
      return { valid: false };
    }
  }

  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        await this.request('/auth/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearAuthData();
    }
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  private clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
  }
}

export const apiService = new ApiService();