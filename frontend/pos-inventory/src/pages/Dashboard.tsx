import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard: React.FC = () => {
  const { 
    summary, 
    salesTrend, 
    categories,   
    lowStockProducts, 
    loading, 
    error, 
    refreshDashboard 
  } = useDashboard();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
        <div className="text-lg text-gray-600">Loading store dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl mx-4 my-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex-1">
            <p className="font-medium flex items-center">
              <span className="mr-2">⚠️</span>
              Error loading dashboard
            </p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <button 
            onClick={refreshDashboard}
            className="mt-3 sm:mt-0 sm:ml-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const salesTrendData = {
    labels: salesTrend?.labels || [],
    datasets: [
      {
        label: 'Revenue',
        data: salesTrend?.revenue || [],
        backgroundColor: 'rgba(72, 187, 120, 0.6)',
        borderColor: 'rgba(72, 187, 120, 1)',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Profit',
        data: salesTrend?.profit || [],
        backgroundColor: 'rgba(52, 168, 83, 0.6)',
        borderColor: 'rgba(52, 168, 83, 1)',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }
    ]
  };

  const salesTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6B7280',
          callback: function(value: any) {
            return '₦' + value.toLocaleString('en-NG');
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
        }
      },
    },
  };

  const categoryData = {
    labels: categories.map(cat => cat.name),
    datasets: [
      {
        data: categories.map(cat => cat.revenue),
        backgroundColor: [
          '#10B981', '#059669', '#047857', '#065F46', '#064E3B',
          '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444'
        ],
        borderWidth: 2,
        borderColor: '#fff',
      }
    ]
  };

  const categoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 12,
          usePointStyle: true,
          font: {
            size: 11
          },
          color: '#374151'
        },
      },
    },
    cutout: '60%',
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Store Dashboard</h2>
          <p className="text-gray-600 mt-2">Real-time analytics for Stop to Shop</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
            <span className="font-medium">Last updated:</span> {new Date().toLocaleString()}
          </div>
          <button 
            onClick={refreshDashboard}
            className="px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg hover:from-green-100 hover:to-emerald-100 border border-green-200 text-sm transition-all flex items-center space-x-2 w-full sm:w-auto justify-center hover:shadow-sm"
          >
            <span className="animate-spin-slow">🔄</span>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Today's Revenue</h3>
            <span className="text-xl bg-green-100 p-2 rounded-lg">💰</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-3">
            {formatCurrency(summary?.todayRevenue || 0)}
          </p>
          <div className="flex items-center mt-3">
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              summary?.revenueChange && summary.revenueChange >= 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {summary?.revenueChange && summary.revenueChange >= 0 ? '↑' : '↓'} 
              {Math.abs(summary?.revenueChange || 0)}%
            </div>
            <span className="text-xs text-gray-500 ml-2">vs yesterday</span>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Total Products</h3>
            <span className="text-xl bg-blue-100 p-2 rounded-lg">📦</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-3">{summary?.totalProducts || 0}</p>
          <p className="text-sm text-gray-500 mt-2">{summary?.totalCategories || 0} categories</p>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Low Stock Alert</h3>
            <span className="text-xl bg-orange-100 p-2 rounded-lg">⚠️</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-orange-600 mt-3">{summary?.lowStockCount || 0}</p>
          <p className="text-sm text-gray-500 mt-2">Require restocking</p>
        </div>

        {/* Today's Orders */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Today's Orders</h3>
            <span className="text-xl bg-purple-100 p-2 rounded-lg">📋</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-3">{summary?.todayOrders || 0}</p>
          <p className="text-sm text-gray-500 mt-2">{summary?.todayItemsSold || 0} items sold</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Sales Trend (Last 7 Days)</h3>
              <p className="text-sm text-gray-500 mt-1">Daily revenue and profit</p>
            </div>
          </div>
          <div className="h-72 md:h-80">
            {salesTrend && salesTrend.labels.length > 0 ? (
              <Bar data={salesTrendData} options={salesTrendOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl">
                <div className="text-5xl mb-4 text-gray-300">📊</div>
                <p className="text-gray-500">No sales data available</p>
                <p className="text-sm text-gray-400 mt-1">Start making sales to see trends</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Revenue by Category</h3>
              <p className="text-sm text-gray-500 mt-1">Top performing categories</p>
            </div>
            <div className="text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
              {categories.length} categories
            </div>
          </div>
          <div className="h-72 md:h-80">
            {categories.length > 0 ? (
              <div className="flex flex-col h-full">
                <div className="h-48">
                  <Doughnut data={categoryData} options={categoryOptions} />
                </div>
                <div className="flex-1 mt-6 overflow-y-auto pr-2">
                  <div className="space-y-3">
                    {categories.map((category, index) => (
                      <div key={category.name} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                            style={{
                              backgroundColor: categoryData.datasets[0].backgroundColor[index]
                            }}
                          ></div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-800 truncate">{category.name}</div>
                            <div className="text-xs text-gray-500">{category.count} products</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold text-gray-800">{formatCurrency(category.revenue)}</div>
                          <div className="text-xs text-gray-500">
                            {category.revenue > 0 ? Math.round((category.revenue / (summary?.todayRevenue || 1)) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl">
                <div className="text-5xl mb-4 text-gray-300">📦</div>
                <p className="text-gray-500">No category data available</p>
                <p className="text-sm text-gray-400 mt-1">Add products to categories</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Value */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Inventory Value</h3>
            <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">Total Worth</span>
          </div>
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-5xl mb-4 text-green-600">💰</div>
              <div className="text-3xl font-bold text-green-700">
                {formatCurrency(summary?.totalStockWorth || 0)}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Current stock investment value
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                <div className="text-xs text-green-600 font-medium">Products</div>
                <div className="text-lg font-bold text-green-700">{summary?.totalProducts || 0}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                <div className="text-xs text-green-600 font-medium">Categories</div>
                <div className="text-lg font-bold text-green-700">{summary?.totalCategories || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Low Stock Products</h3>
            <span className="text-xs font-medium text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
              {lowStockProducts.length} items
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(product => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">{product.name}</div>
                    <div className="text-sm text-gray-600 truncate mt-1">{product.category}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-semibold text-orange-600">{product.stock} left</div>
                    <div className="text-xs text-gray-500 mt-1">{formatCurrency(product.sell_price)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-5xl mb-4 text-gray-300">✅</div>
                <p className="text-gray-600">All products well stocked</p>
                <p className="text-sm text-gray-400 mt-1">Inventory is at optimal levels</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/inventory'}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2 shadow-sm hover:shadow"
            >
              <span className="text-lg">➕</span>
              <span>Add New Product</span>
            </button>
            <button 
              onClick={() => window.location.href = '/pos'}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2 shadow-sm hover:shadow"
            >
              <span className="text-lg">🛒</span>
              <span>Start New Sale</span>
            </button>
            <button 
              onClick={() => window.location.href = '/sales'}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center space-x-2 shadow-sm hover:shadow"
            >
              <span className="text-lg">📊</span>
              <span>View Sales Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add custom animation for refresh */}
      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;