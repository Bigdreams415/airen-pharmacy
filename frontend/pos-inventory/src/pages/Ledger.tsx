import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sale } from '../types';
import { useSales } from '../hooks/useLedger';

const formatDateSafe = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : format(date, 'MMM dd, yyyy');
  } catch {
    return '';
  }
};

const Sales: React.FC = () => {
  const { getAllSales, getSalesByDate } = useSales();

  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSales = async () => {
    setLoading(true);
    try {
      console.log('Loading all sales...');
      const salesData = await getAllSales();
      
      console.log('Total sales loaded:', salesData.length);
      
      const dates = salesData.map(s => s.created_at).filter(Boolean).sort();
      if (dates.length > 0) {
        console.log('Date range in data:', {
          earliest: dates[0],
          latest: dates[dates.length - 1]
        });
      }
      
      setSales(salesData);
      setFilteredSales(salesData);  
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dateFilter) {
      setFilteredSales(sales);
      setIsFiltering(false);
      return;
    }

    const fetchSalesForDate = async () => {
      setIsFiltering(true);
      try {
        console.log('🔄 Fetching sales for date:', dateFilter);
        const dateSales = await getSalesByDate(dateFilter);
        console.log('✅ Found sales for date:', dateSales.length);
        setFilteredSales(dateSales);
      } catch (error) {
        console.error('❌ Failed to fetch sales for date:', error);
        setFilteredSales([]);
      } finally {
        setIsFiltering(false);
      }
    };

    fetchSalesForDate();  
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, getSalesByDate]);

  const getCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getSalesForDate = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-CA');
    return sales.filter(sale => {
      if (!sale.created_at) return false;
      const saleDate = new Date(sale.created_at).toLocaleDateString('en-CA');
      return saleDate === dateStr;
    });
  };

  const handleDateSelect = (date: Date) => {
    setDateFilter(date.toLocaleDateString('en-CA'));
    setShowCalendar(false);
  };

  const clearFilters = () => {
    setDateFilter('');
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'card': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'transfer': return 'bg-purple-100 text-purple-800 border border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? 'text-blue-600' : 'text-red-600';
  };

  const getSaleIntensity = (date: Date) => {
    const salesCount = getSalesForDate(date).length;
    if (salesCount === 0) return 'bg-white hover:bg-gray-50';
    if (salesCount <= 2) return 'bg-blue-50 hover:bg-blue-100';
    if (salesCount <= 5) return 'bg-blue-200 hover:bg-blue-300';
    return 'bg-blue-500 text-white hover:bg-blue-600';
  };

  const calendarDays = getCalendarDays();
  const today = new Date();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="text-lg text-gray-600">Loading sales history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales History</h2>
          <p className="text-gray-600 mt-1">Track all store transactions</p>
        </div>
        
        {/* Enhanced Filter Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative">
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                id="date-filter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm"
              >
                📅 Calendar View
              </button>
            </div>

            {/* Enhanced Calendar Dropdown */}
            {showCalendar && (
              <div className="fixed sm:absolute top-1/2 left-1/2 sm:top-full sm:left-0 sm:right-auto mt-2 bg-white border border-gray-300 rounded-xl shadow-2xl z-50 p-4 w-[90vw] sm:w-80 lg:w-96 transform -translate-x-1/2 sm:translate-x-0 sm:transform-none">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">
                    {format(today, 'MMMM yyyy')}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 text-sm bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowCalendar(false)}
                      className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date) => {
                    const salesCount = getSalesForDate(date).length;
                    const isSelected = dateFilter === date.toISOString().split('T')[0];
                    const isToday = date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
                    const isCurrentMonth = date.getMonth() === today.getMonth();
                    
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleDateSelect(date)}
                        disabled={!isCurrentMonth}
                        className={`
                          h-8 rounded-lg text-sm font-medium transition-all
                          ${getSaleIntensity(date)}
                          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                          ${isToday ? 'border-2 border-blue-400' : ''}
                          ${!isCurrentMonth ? 'text-gray-300 bg-gray-50' : ''}
                          ${salesCount > 0 ? 'hover:shadow-md' : ''}
                        `}
                        title={salesCount > 0 ? 
                          `${salesCount} sale${salesCount > 1 ? 's' : ''} on ${format(date, 'MMM dd')}` : 
                          `No sales on ${format(date, 'MMM dd')}`
                        }
                      >
                        {format(date, 'd')}
                        {salesCount > 0 && (
                          <div className={`w-1.5 h-1.5 mx-auto mt-0.5 rounded-full ${
                            salesCount <= 2 ? 'bg-blue-400' : 
                            salesCount <= 5 ? 'bg-blue-600' : 'bg-blue-800'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Sales Legend */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Sales Activity Legend:</p>
                  <div className="flex flex-col gap-2 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-50 rounded mr-2"></div>
                        <span>1-2 sales</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-200 rounded mr-2"></div>
                        <span>3-5 sales</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                        <span>5+ sales</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {(dateFilter) && (
            <div className="flex items-center space-x-2 mt-2 sm:mt-6">
              <span className="text-sm text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-200">
                📅 {formatDateSafe(dateFilter)}
              </span>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm bg-gradient-to-r from-red-100 to-red-200 text-red-700 rounded-lg hover:from-red-200 hover:to-red-300 transition-all border border-red-300"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-xl">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{filteredSales.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-xl">💰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{filteredSales.reduce((sum: number, sale: Sale) => sum + (sale.total_amount || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-xl">💸</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-blue-600">
                ₦{filteredSales.reduce((sum, sale) => sum + (sale.total_profit || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-xl">📦</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Items Sold</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredSales.reduce((sum: number, sale: Sale) => 
                  sum + (sale.items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0) || 0), 0
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isFiltering ? (
            <div className="text-center py-16">
              <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4 text-lg">Loading sales for {formatDateSafe(dateFilter)}...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-7xl mb-6">📊</div>
              <p className="text-gray-500 text-xl mb-3">
                {dateFilter ? `No sales recorded on ${formatDateSafe(dateFilter)}` : 'No sales recorded yet'}
              </p>
              <p className="text-gray-400 mb-6">
                {dateFilter ? 'Try selecting a different date' : 'Start making sales to see data here'}
              </p>
              <button
                onClick={loadSales}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md font-medium"
              >
                Refresh Data
              </button>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                    Sale ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 font-bold">
                        #{sale.id?.slice(-8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {sale.created_at ? format(new Date(sale.created_at), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {sale.created_at ? format(new Date(sale.created_at), 'hh:mm a') : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold text-sm">
                            {sale.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-900 font-medium">
                            <span className="font-bold">
                              {sale.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0}
                            </span> items
                          </div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {sale.items?.slice(0, 2).map(item => {
                              const productName = item.product_name || 
                                                item.product?.name || 
                                                `Product #${item.product_id?.slice(-6) || 'N/A'}`;
                              return productName;
                            }).join(', ')}
                            {sale.items && sale.items.length > 2 && ` +${sale.items.length - 2} more`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-4 py-2 text-xs font-bold rounded-full capitalize ${getPaymentMethodColor(sale.payment_method || 'unknown')}`}>
                        {sale.payment_method || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900">
                        ₦{(sale.total_amount || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-lg font-bold ${getProfitColor(sale.total_profit || 0)}`}>
                        ₦{(sale.total_profit || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-lg font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm hover:shadow"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {isFiltering ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4 text-lg">Loading sales...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-gray-400 text-7xl mb-6">📊</div>
            <p className="text-gray-500 text-lg mb-3">
              {dateFilter ? `No sales on ${formatDateSafe(dateFilter)}` : 'No sales recorded yet'}
            </p>
            <button
              onClick={loadSales}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-md"
            >
              Refresh Data
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSales.map((sale) => (
              <div key={sale.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-bold text-gray-900 text-base">#{sale.id?.slice(-8)}</div>
                    <div className="text-xs text-gray-500">
                      {sale.created_at ? format(new Date(sale.created_at), 'MMM dd, yyyy • hh:mm a') : 'N/A'}
                    </div>
                  </div>
                  <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full capitalize ${getPaymentMethodColor(sale.payment_method || 'unknown')}`}>
                    {sale.payment_method || 'unknown'}
                  </span>
                </div>
                
                <div className="space-y-3 text-sm mb-5">
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-bold text-gray-900">
                      {sale.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-bold text-gray-900">
                      ₦{(sale.total_amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                    <span className="text-gray-600">Profit:</span>
                    <span className={`font-bold ${getProfitColor(sale.total_profit || 0)}`}>
                      ₦{(sale.total_profit || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedSale(sale)}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 rounded-lg font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
                >
                  View Sale Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">💰</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Sale Receipt #{selectedSale.id?.slice(-8) || 'N/A'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedSale.created_at ? format(new Date(selectedSale.created_at), 'PPPP p') : 'Date not available'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl bg-white rounded-full p-3 hover:bg-gray-100 transition-colors shadow-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Sale Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-bold text-lg capitalize text-gray-900 mt-2">
                    {selectedSale.payment_method || 'N/A'}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-3 py-1.5 text-sm font-bold rounded-full mt-2 ${
                    selectedSale.status === 'completed' 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {selectedSale.status || 'unknown'}
                  </span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="font-bold text-2xl text-gray-900 mt-2">
                    {selectedSale.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <p className="text-sm text-gray-600">Products</p>
                  <p className="font-bold text-2xl text-gray-900 mt-2">
                    {selectedSale.items?.length || 0}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <h4 className="font-bold text-gray-900 mb-4 text-xl border-b pb-3">Items Sold</h4>
              {!selectedSale.items || selectedSale.items.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <div className="text-gray-400 text-5xl mb-4">📦</div>
                  <p className="text-gray-500 text-lg">No items found for this sale</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">
                          Profit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSale.items.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                                <span className="text-blue-700 font-bold">
                                  {item.product?.name?.charAt(0) || 'P'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {item.product_name || item.product?.name || `Product #${item.product_id?.slice(-6) || 'N/A'}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full text-sm font-bold">
                              {item.quantity || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            <div className="font-medium">₦{(item.unit_sell_price || 0).toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">
                            ₦{(item.total_sell_price || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className={`font-bold text-center px-3 py-2 rounded-lg ${
                              (item.item_profit || 0) >= 0 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              ₦{(item.item_profit || 0).toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals Section */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
                  <h5 className="font-bold text-gray-800 mb-4 text-lg">Financial Summary</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-bold">₦{(selectedSale.total_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
                      <span>Total Revenue:</span>
                      <span className="text-blue-600">₦{(selectedSale.total_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-6">
                  <h5 className="font-bold text-gray-800 mb-4 text-lg">Profit Analysis</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Cost:</span>
                      <span className="font-bold">
                        ₦{((selectedSale.total_amount || 0) - (selectedSale.total_profit || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
                      <span>Net Profit:</span>
                      <span className={getProfitColor(selectedSale.total_profit || 0)}>
                        ₦{(selectedSale.total_profit || 0).toLocaleString()}
                      </span>
                    </div>
                    {selectedSale.total_amount && selectedSale.total_amount > 0 && (
                      <div className="text-sm text-gray-600 text-center mt-2">
                        Profit Margin: {((selectedSale.total_profit / selectedSale.total_amount) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Close Receipt
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 rounded-xl font-bold hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
                >
                  <span className="text-xl">🖨️</span>
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;