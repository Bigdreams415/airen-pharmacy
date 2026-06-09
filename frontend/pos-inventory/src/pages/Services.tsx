import React, { useState } from 'react';
import { useServices } from '../hooks/useService';
import { Service } from '../types';

const Services: React.FC = () => {
  const {
    services,
    serviceSales,
    serviceStats,
    salesStats,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    recordServiceSale,
    refreshAll
  } = useServices();
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'sales'>('services');
  
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'delivery',
    description: '',
    price: 0,
    duration: 30
  });

  const [saleForm, setSaleForm] = useState({
    service_id: '',
    quantity: 1,
    unit_price: 0,
    served_by: '',
    notes: ''
  });

  // Updated service categories for grocery store
  const serviceCategories = [
    'delivery',
    'packaging', 
    'special_order',
    'gift_wrapping',
    'bulk_discount',
    'installation',
    'assembly'
  ];

  const categoryLabels: { [key: string]: string } = {
    delivery: 'Home Delivery',
    packaging: 'Special Packaging',
    special_order: 'Special Order',
    gift_wrapping: 'Gift Wrapping',
    bulk_discount: 'Bulk Discount',
    installation: 'Product Installation',
    assembly: 'Product Assembly'
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   
    const success = editingService
      ? await updateService(editingService.id, serviceForm)
      : await createService(serviceForm);
    if (success) {
      setShowServiceModal(false);
      setEditingService(null);
      setServiceForm({ name: '', category: 'delivery', description: '', price: 0, duration: 30 });
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   
    const success = await recordServiceSale(saleForm);
   
    if (success) {
      setShowSaleModal(false);
      setSaleForm({ service_id: '', quantity: 1, unit_price: 0, served_by: '', notes: '' });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      await deleteService(serviceId);
    }
  };

  const handleToggleServiceStatus = async (serviceId: string) => {
    await toggleServiceStatus(serviceId);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      delivery: 'bg-green-100 text-green-800',
      packaging: 'bg-blue-100 text-blue-800',
      special_order: 'bg-purple-100 text-purple-800',
      gift_wrapping: 'bg-pink-100 text-pink-800',
      bulk_discount: 'bg-orange-100 text-orange-800',
      installation: 'bg-indigo-100 text-indigo-800',
      assembly: 'bg-teal-100 text-teal-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Calculate today's revenue from service sales
  const calculateTodayServiceRevenue = () => {
    const today = new Date().toDateString();
    return serviceSales
      .filter(sale => new Date(sale.created_at).toDateString() === today)
      .reduce((total, sale) => total + sale.total_amount, 0);
  };

  // Calculate total revenue from service sales
  const calculateTotalServiceRevenue = () => {
    return serviceSales.reduce((total, sale) => total + sale.total_amount, 0);
  };

  if (loading && services.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
        <div className="text-lg text-gray-600">Loading store services...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Store Services</h1>
          <p className="text-gray-600 mt-1">Manage additional services and track service revenue</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowSaleModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <span className="text-lg">💰</span>
            <span>Record Service Sale</span>
          </button>
          <button
            onClick={() => setShowServiceModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <span className="text-lg">➕</span>
            <span>Add New Service</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-500 mr-3">⚠️</span>
              <div>
                <p className="font-medium">Error Loading Services</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={refreshAll}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Total Services</h3>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {serviceStats?.total_services || services.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Available store services</p>
            </div>
            <span className="text-3xl bg-gradient-to-r from-green-500 to-emerald-600 text-white w-16 h-16 rounded-xl flex items-center justify-center shadow-sm">
              🏪
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Today's Revenue</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(salesStats?.today_revenue || calculateTodayServiceRevenue())}
              </p>
              <p className="text-xs text-gray-500 mt-1">From service sales today</p>
            </div>
            <span className="text-3xl bg-gradient-to-r from-blue-500 to-blue-600 text-white w-16 h-16 rounded-xl flex items-center justify-center shadow-sm">
              💰
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Total Revenue</h3>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {formatCurrency(salesStats?.total_revenue || calculateTotalServiceRevenue())}
              </p>
              <p className="text-xs text-gray-500 mt-1">All-time service revenue</p>
            </div>
            <span className="text-3xl bg-gradient-to-r from-purple-500 to-purple-600 text-white w-16 h-16 rounded-xl flex items-center justify-center shadow-sm">
              📊
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('services')}
              className={`py-5 px-8 text-center border-b-2 font-medium text-sm transition-all ${
                activeTab === 'services'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Services List
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-5 px-8 text-center border-b-2 font-medium text-sm transition-all ${
                activeTab === 'sales'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Service Sales History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Store Services</h2>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                    {services.filter(s => s.is_active).length} active services
                  </span>
                  <span className="text-sm text-gray-600 bg-blue-100 px-3 py-1.5 rounded-full">
                    {services.length} total services
                  </span>
                </div>
              </div>

              {services.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-7xl mb-6 text-gray-300">🚚</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-3">No Services Added Yet</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Add value-added services like delivery, packaging, or special orders to enhance customer experience
                  </p>
                  <button
                    onClick={() => setShowServiceModal(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
                  >
                    Add First Service
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map(service => (
                    <div key={service.id} className={`bg-white rounded-xl border-2 transition-all hover:shadow-md ${
                      service.is_active ? 'border-gray-200 hover:border-green-300' : 'border-gray-100 opacity-60'
                    }`}>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-gray-800 text-lg">{service.name}</h3>
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${getCategoryColor(service.category)}`}>
                            {categoryLabels[service.category]}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                        
                        <div className="flex justify-between items-center text-sm mb-5">
                          <div>
                            <span className="font-bold text-green-600">{formatCurrency(service.price)}</span>
                            <span className="text-gray-500 ml-2">• {service.duration} mins</span>
                          </div>
                          <div className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                            service.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {service.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </div>

                        <div className="flex justify-between space-x-3">
                          <button
                            onClick={() => handleToggleServiceStatus(service.id)}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                              service.is_active
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {service.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setServiceForm({
                                name: service.name,
                                category: service.category,
                                description: service.description || '',
                                price: service.price,
                                duration: service.duration
                              });
                              setShowServiceModal(true);
                            }}
                            className="flex-1 py-2.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-sm font-bold rounded-lg hover:from-blue-200 hover:to-blue-300 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="flex-1 py-2.5 bg-gradient-to-r from-red-100 to-red-200 text-red-700 text-sm font-bold rounded-lg hover:from-red-200 hover:to-red-300 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Service Sales History</h2>
                <p className="text-sm text-gray-600 bg-green-100 px-3 py-1.5 rounded-full">
                  {serviceSales.length} total sales
                </p>
              </div>

              {serviceSales.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-7xl mb-6 text-gray-300">💰</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-3">No Service Sales Recorded</h3>
                  <p className="text-gray-500 mb-6">Start recording service sales to track additional revenue</p>
                  <button
                    onClick={() => setShowSaleModal(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
                  >
                    Record First Service Sale
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-green-800 uppercase tracking-wider">
                            Service
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-green-800 uppercase tracking-wider">
                            Served By
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-green-800 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-green-800 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-green-800 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {serviceSales.map(sale => (
                          <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {sale.service?.name}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {sale.service && categoryLabels[sale.service.category]}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {sale.served_by}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(sale.created_at).toLocaleDateString()} at{' '}
                              {new Date(sale.created_at).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                {sale.quantity}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                              {formatCurrency(sale.total_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button
                onClick={() => {
                  setShowServiceModal(false);
                  setEditingService(null);
                  setServiceForm({ name: '', category: 'delivery', description: '', price: 0, duration: 30 });
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleServiceSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Service Name *</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder="e.g., Home Delivery Service"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({...serviceForm, category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  >
                    {serviceCategories.map(cat => (
                      <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    rows={3}
                    placeholder="Describe the service details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₦) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({...serviceForm, price: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (mins) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={serviceForm.duration}
                      onChange={(e) => setServiceForm({...serviceForm, duration: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowServiceModal(false);
                    setEditingService(null);
                    setServiceForm({ name: '', category: 'delivery', description: '', price: 0, duration: 30 });
                  }}
                  className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
                >
                  {editingService ? 'Update Service' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Service Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Record Service Sale</h3>
              <button
                onClick={() => {
                  setShowSaleModal(false);
                  setSaleForm({ service_id: '', quantity: 1, unit_price: 0, served_by: '', notes: '' });
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Service *</label>
                  <select
                    required
                    value={saleForm.service_id}
                    onChange={(e) => {
                      const service = services.find(s => s.id === e.target.value);
                      setSaleForm({
                        ...saleForm,
                        service_id: e.target.value,
                        unit_price: service?.price || 0
                      });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  >
                    <option value="">Select a service</option>
                    {services.filter(s => s.is_active).map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {formatCurrency(service.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={saleForm.quantity}
                      onChange={(e) => setSaleForm({...saleForm, quantity: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Price (₦) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={saleForm.unit_price}
                      onChange={(e) => setSaleForm({...saleForm, unit_price: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Served By *</label>
                  <input
                    type="text"
                    required
                    value={saleForm.served_by}
                    onChange={(e) => setSaleForm({...saleForm, served_by: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder="e.g., Staff Name or Delivery Person"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={saleForm.notes}
                    onChange={(e) => setSaleForm({...saleForm, notes: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    rows={3}
                    placeholder="Any additional notes about the service..."
                  />
                </div>

                {saleForm.service_id && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Total Amount:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(saleForm.unit_price * saleForm.quantity)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaleModal(false);
                    setSaleForm({ service_id: '', quantity: 1, unit_price: 0, served_by: '', notes: '' });
                  }}
                  className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!saleForm.service_id}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  Record Service Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;