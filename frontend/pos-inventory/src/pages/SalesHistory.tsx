import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sale } from '../types';
import { useSales } from '../hooks/useSales';

const SalesHistory: React.FC = () => {
  const { getAllSales, getSalesByDate } = useSales();

  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isFiltering, setIsFiltering] = useState<boolean>(false);

  const loadSales = async () => {
    try {
      console.log('Loading all sales...');
      const salesData = await getAllSales();
      console.log('Total sales loaded:', salesData.length);
      
      const dates = salesData.map((s: Sale) => s.created_at).filter(Boolean).sort();
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
  } else {
    const fetchSalesForDate = async () => {
      setIsFiltering(true);
      try {
        console.log('Fetching sales for date:', dateFilter);
        const dateSales = await getSalesByDate(dateFilter);
        setFilteredSales(dateSales);
        console.log('Found sales for date:', dateSales.length);
      } catch (error) {
        console.error('Failed to fetch sales for date:', error);
        setFilteredSales([]);
      } finally {
        setIsFiltering(false);
      }
    };

    fetchSalesForDate();
  }
}, [dateFilter, sales, getSalesByDate, setIsFiltering]);

  // Enhanced calendar functions
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
    const dateStr = date.toLocaleDateString('en-CA'); // Use local date string
    return sales.filter(sale => {
      if (!sale.created_at) return false;
      const saleDate = new Date(sale.created_at).toLocaleDateString('en-CA');
      return saleDate === dateStr;
    });
  };

  const handleDateSelect = (date: Date) => {
    setDateFilter(date.toLocaleDateString('en-CA')); // Use local date format
    setShowCalendar(false);
  };

  const clearFilters = () => {
    setDateFilter('');
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800 border border-green-200';
      case 'card': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'transfer': return 'bg-purple-100 text-purple-800 border border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getSaleIntensity = (date: Date) => {
    const salesCount = getSalesForDate(date).length;
    if (salesCount === 0) return 'bg-white hover:bg-gray-50';
    if (salesCount <= 2) return 'bg-green-100 hover:bg-green-200';
    if (salesCount <= 5) return 'bg-green-300 hover:bg-green-400';
    return 'bg-green-500 text-white hover:bg-green-600';
  };

  const calendarDays = getCalendarDays();
  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Sales History</h2>
          <p className="text-green-600 mt-1">View your sales transactions</p>
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black border border-gray-900 transition-colors"
              >
                📅 Calendar
              </button>
            </div>

            {/* Enhanced Calendar Dropdown - Fixed positioning */}
            {showCalendar && (
              <div className="fixed sm:absolute top-1/2 left-1/2 sm:top-full sm:left-0 sm:right-auto mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-4 w-[90vw] sm:w-80 lg:w-96 transform -translate-x-1/2 sm:translate-x-0 sm:transform-none">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">
                    {format(today, 'MMMM yyyy')}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={clearFilters}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowCalendar(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
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
                          ${isSelected ? 'ring-2 ring-green-500 ring-offset-2' : ''}
                          ${isToday ? 'border-2 border-green-400' : ''}
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
                          <div className={`w-1 h-1 mx-auto mt-1 rounded-full ${
                            salesCount <= 2 ? 'bg-green-400' : 
                            salesCount <= 5 ? 'bg-green-600' : 'bg-green-800'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Sales Legend */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-100 rounded mr-1"></div>
                      <span>1-2 sales</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-300 rounded mr-1"></div>
                      <span>3-5 sales</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                      <span>5+ sales</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {(dateFilter) && (
            <div className="flex items-center space-x-2 mt-2 sm:mt-6">
              <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded">
                {format(new Date(dateFilter), 'MMM dd, yyyy')}
              </span>
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sales Summary Cards - Simplified for Cashier */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <span className="text-black text-sm lg:text-xl">💰</span>
              </div>
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-lg lg:text-2xl font-semibold text-gray-900">{filteredSales.length}</p>
            </div>
          </div>
        </div>

        {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm lg:text-xl">📈</span>
              </div>
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-lg lg:text-2xl font-semibold text-gray-900">
                ₦{filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div> */}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <span className="text-black text-sm lg:text-xl">📦</span>
              </div>
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Items Sold</p>
              <p className="text-lg lg:text-2xl font-semibold text-gray-900">
                {filteredSales.reduce((sum: number, sale: Sale) => 
                  sum + (sale.items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0) || 0), 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View - Simplified for Cashier */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <p className="text-gray-500 text-lg mb-2">
              {dateFilter ? `No sales on ${format(new Date(dateFilter), 'MMM dd, yyyy')}` : 'No sales recorded yet'}
            </p>
            <button
              onClick={loadSales}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium"
            >
              Refresh Data
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 font-medium">
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
                      <div className="text-sm text-gray-900">
                        <span className="font-semibold">
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full capitalize ${getPaymentMethodColor(sale.payment_method || 'unknown')}`}>
                        {sale.payment_method || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ₦{(sale.total_amount || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="text-gray-700 hover:text-gray-900 font-medium bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors border border-gray-200"
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

      {/* Mobile Card View - Simplified for Cashier */}
      <div className="lg:hidden">
        {filteredSales.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <p className="text-gray-500 text-lg mb-2">
              {dateFilter ? `No sales on ${format(new Date(dateFilter), 'MMM dd, yyyy')}` : 'No sales recorded yet'}
            </p>
            <button
              onClick={loadSales}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium"
            >
              Refresh Data
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSales.map((sale) => (
              <div key={sale.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">#{sale.id?.slice(-8)}</div>
                    <div className="text-xs text-gray-500">
                      {sale.created_at ? format(new Date(sale.created_at), 'MMM dd, yyyy • hh:mm a') : 'N/A'}
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getPaymentMethodColor(sale.payment_method || 'unknown')}`}>
                    {sale.payment_method || 'unknown'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">
                      {sale.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium text-gray-900">
                      ₦{(sale.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedSale(sale)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  View Sale Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Sale Details Modal - Simplified for Cashier */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900">
                    Sale Receipt #{selectedSale.id?.slice(-8) || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedSale.created_at ? format(new Date(selectedSale.created_at), 'PPPP p') : 'Date not available'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 lg:p-6">
              {/* Sale Summary Cards - Simplified */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-4 text-center">
                  <p className="text-xs lg:text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold text-sm lg:text-lg capitalize text-gray-900 mt-1">
                    {selectedSale.payment_method || 'N/A'}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-4 text-center">
                  <p className="text-xs lg:text-sm text-gray-600">Total Items</p>
                  <p className="font-semibold text-lg lg:text-2xl text-gray-900 mt-1">
                    {selectedSale.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 lg:p-4 text-center">
                  <p className="text-xs lg:text-sm text-gray-600">Products</p>
                  <p className="font-semibold text-lg lg:text-2xl text-gray-900 mt-1">
                    {selectedSale.items?.length || 0}
                  </p>
                </div>
              </div>

              {/* Items Table - Simplified */}
              <h4 className="font-bold text-gray-900 mb-4 text-lg border-b pb-2">Items Sold</h4>
              {!selectedSale.items || selectedSale.items.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 text-4xl mb-2">📦</div>
                  <p className="text-gray-500">No items found for this sale</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSale.items.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 lg:px-6 py-3">
                            <div className="flex items-center space-x-2">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-xs">
                                  {item.product?.name?.charAt(0) || 'P'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-sm">
                                  {item.product_name || item.product?.name || `Product #${item.product_id?.slice(-6) || 'N/A'}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-3">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                              {item.quantity || 0}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-xs lg:text-sm text-gray-600">
                            <div className="font-medium">₦{(item.unit_sell_price || 0).toFixed(2)}</div>
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-xs lg:text-sm font-semibold text-gray-900">
                            ₦{(item.total_sell_price || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals Section - Simplified */}
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4 lg:p-6">
                <h5 className="font-semibold text-gray-800 mb-3 lg:mb-4">Sale Summary</h5>
                <div className="space-y-2 lg:space-y-3">
                  <div className="flex justify-between items-center text-base lg:text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">₦{(selectedSale.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 lg:py-4 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Close Receipt
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-6 bg-gray-600 text-white py-3 lg:py-4 rounded-lg font-bold hover:bg-gray-700 transition-all shadow-lg"
                >
                  🖨️ Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;