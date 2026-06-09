import React, { useState, useEffect } from 'react';

interface Store {
  id: string;
  name: string;
  location: string;
  address?: string;
  phone_number?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NewStoreForm {
  name: string;
  location: string;
  address: string;
  phone_number: string;
  email: string;
}

interface SyncState {
  lastSync: string | null;
  isSyncing: boolean;
  progress: number;
  error: string | null;
}

const API_BASE_URL = 'https://abra-store-project.onrender.com/api';  
const CLOUD_SYNC_URL = 'not longer applicable';  

const DesktopHeader: React.FC = () => {
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStore, setNewStore] = useState<NewStoreForm>({
    name: '',
    location: '',
    address: '',
    phone_number: '',
    email: ''
  });
  const [storeCount, setStoreCount] = useState({ count: 0, max_limit: 5, remaining: 5 });

  // Sync state
  const [syncState, setSyncState] = useState<SyncState>({
    lastSync: null,
    isSyncing: false,
    progress: 0,
    error: null
  });

  useEffect(() => {
    fetchStores();
    fetchCurrentStore();
    fetchStoreCount();
    fetchSyncStatus();
  }, []);

  // Poll sync status every 2 seconds when syncing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (syncState.isSyncing) {
      interval = setInterval(() => {
        fetchSyncStatus();
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [syncState.isSyncing]);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch(`${CLOUD_SYNC_URL}/sync/status`, {
        headers: {
          'x-api-key': 'VDJajN7sSbPrxq36rhOfPxd1tU+5dZlrfVOdV9CHlgSJyaYC/bOe/lTjhWEM2zC9NpiRyYZjf84P1T96T97KA=='
        }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSyncState(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncState(prev => ({ ...prev, isSyncing: true, error: null, progress: 10 }));
      const response = await fetch(`${CLOUD_SYNC_URL}/sync/manual`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': 'VDJajN7sSbPrxq36rhOfPxd1tU+5dZlrfVOdV9CHlgSJyaYC/bOe/lTjhWEM2zC9NpiRyYZjf84P1T96T97KA=='
        },
      });
    
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSyncState(result.data);
        } else {
          setSyncState(prev => ({ ...prev, error: 'Sync failed', isSyncing: false }));
        }
      } else {
        setSyncState(prev => ({ ...prev, error: 'Sync request failed', isSyncing: false }));
      }
    } catch (error) {
      setSyncState(prev => ({ ...prev, error: 'Sync failed', isSyncing: false }));
    }
  };

  const getSyncStatusText = () => {
    if (syncState.isSyncing) return `Syncing to Cloud... ${syncState.progress}%`;
    if (syncState.error) return `Sync Failed: ${syncState.error}`;
    if (syncState.lastSync) return `Last Sync: ${new Date(syncState.lastSync).toLocaleTimeString()}`;
    return 'Ready to Sync';
  };

  const getSyncStatusColor = () => {
    if (syncState.isSyncing) return 'bg-blue-500';
    if (syncState.error) return 'bg-red-500';
    return 'bg-blue-500';
  };

  const fetchCurrentStore = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pharmacy/current`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch current store: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setCurrentStore(result.data);
      } else {
        setError('No current store set');
      }
    } catch (err) {
      console.error('Error fetching current store:', err);
      setError('Failed to load current store');
    }
  };

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/pharmacies`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stores: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setStores(result.data);
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stores');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pharmacies/count`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStoreCount(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching store count:', err);
    }
  };

  const switchStore = async (storeId: string) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/pharmacy/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to switch store: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setCurrentStore(result.data);
        setShowStoreModal(false);
        window.location.reload();
      } else {
        throw new Error(result.error || 'Failed to switch store');
      }
    } catch (err) {
      console.error('Error switching store:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to switch store';
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const createNewStore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);

      const response = await fetch(`${API_BASE_URL}/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStore),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create store: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setShowCreateModal(false);
        setNewStore({ name: '', location: '', address: '', phone_number: '', email: '' });
        await fetchStores();
        await fetchStoreCount();
        alert('Store created successfully!');
      } else {
        throw new Error(result.error || 'Failed to create store');
      }
    } catch (err) {
      console.error('Error creating store:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to create store';
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const deleteStore = async (storeId: string) => {
    if (!window.confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete store: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        await fetchStores();
        await fetchStoreCount();
        if (currentStore?.id === storeId) {
          const otherStore = stores.find(p => p.id !== storeId);
          if (otherStore) {
            await switchStore(otherStore.id);
          }
        }
        alert('Store deleted successfully!');
      } else {
        throw new Error(result.error || 'Failed to delete store');
      }
    } catch (err) {
      console.error('Error deleting store:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete store';
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleInputChange = (field: keyof NewStoreForm, value: string) => {
    setNewStore(prev => ({ ...prev, [field]: value }));
  };

  const handleCloseAllModals = () => {
    setShowStoreModal(false);
    setShowCreateModal(false);
    setShowManageModal(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 hidden lg:block">
      {/* Sync Progress Bar */}
      {syncState.isSyncing && (
        <div className="w-full bg-gray-200 h-2">
          <div 
            className={`h-2 transition-all duration-300 ${getSyncStatusColor()}`}
            style={{ width: `${syncState.progress}%` }}
          />
        </div>
      )}

      {/* Sync Status Bar */}
      {syncState.isSyncing && (
        <div className={`w-full px-4 py-2 text-white text-sm font-medium ${getSyncStatusColor()} flex justify-between items-center`}>
          <span>{getSyncStatusText()}</span>
          <span className="text-xs opacity-90">Syncing data to cloud...</span>
        </div>
      )}

      {/* Error Status Bar */}
      {syncState.error && !syncState.isSyncing && (
        <div className="w-full px-4 py-2 bg-red-500 text-white text-sm font-medium flex justify-between items-center">
          <span>{getSyncStatusText()}</span>
          <button 
            onClick={handleManualSync}
            className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm bg-transparent hover:shadow-md transition-shadow">
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">AP</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-700">Airen Pharmacy</h1>
              <p className="text-sm text-gray-600">Pharmacy Inventory System</p>
            </div>
          </div>
        </div>    
        
        {/* Store Button with Sync Status */}
        <div className="flex items-center space-x-3">
          {/* Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={syncState.isSyncing}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm
              ${syncState.isSyncing
                ? 'bg-blue-100 text-blue-700 border border-blue-200 cursor-not-allowed'
                : syncState.error
                ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 hover:shadow-md'
              }
            `}
            title={getSyncStatusText()}
          >
            <span className={`${syncState.isSyncing ? 'animate-spin' : ''}`}>
              {syncState.isSyncing ? '🔄' : syncState.error ? '❌' : '☁️'}
            </span>
            <span>Sync Data</span>
          </button>

          {/* Store Button */}
          <button 
            onClick={() => setShowStoreModal(true)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group border border-gray-200 hover:border-blue-300"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                {currentStore?.name || 'No Store Selected'}
              </p>
              <p className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">
                {currentStore?.location || 'Select Store'}
              </p>
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:from-blue-600 group-hover:to-indigo-700 transition-all shadow-sm bg-transparent">
              <span className="font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                {currentStore ? getInitials(currentStore.name) : 'ST'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Store Switcher Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-end pt-16">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleCloseAllModals}
          />
          
          <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-[80vh] overflow-hidden z-10 mr-4 transform transition-all">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-blue-800">Select Store</h3>
                <button 
                  onClick={handleCloseAllModals}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {currentStore && (
                <p className="text-sm text-gray-600 mt-1">
                  Current: <span className="font-medium text-blue-600">{currentStore.name}</span>
                </p>
              )}
              <div className="mt-2 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                {storeCount.count} of {storeCount.max_limit} stores used
              </div>
            </div>

            <div className="flex flex-col h-[calc(80vh-120px)]">
              <div className="p-3 space-y-2 border-b border-gray-100">
                <button 
                  onClick={() => {
                    setShowStoreModal(false);
                    setShowManageModal(true);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-lg flex items-center justify-between transition-colors border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600">⚙️</span>
                    </div>
                    <span className="font-medium">Manage Stores</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                
                <button 
                  onClick={() => {
                    setShowStoreModal(false);
                    setShowCreateModal(true);
                  }}
                  disabled={storeCount.remaining <= 0}
                  className={`w-full text-left px-4 py-3 text-sm rounded-lg flex items-center justify-between transition-colors border ${
                    storeCount.remaining <= 0 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'hover:bg-gray-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      storeCount.remaining <= 0 ? 'bg-gray-200' : 'bg-blue-100'
                    }`}>
                      <span className={storeCount.remaining <= 0 ? 'text-gray-400' : 'text-blue-600'}>
                        ➕
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Create New Store</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {storeCount.remaining > 0 
                          ? `${storeCount.remaining} slots available` 
                          : 'Limit reached'}
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 px-2">Available Stores</h4>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : stores.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-gray-400">🛒</span>
                      </div>
                      <p className="text-sm">No stores available</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stores.map((store) => (
                        <button
                          key={store.id}
                          onClick={() => switchStore(store.id)}
                          className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all duration-200 ${
                            currentStore?.id === store.id 
                              ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                              : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              currentStore?.id === store.id ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <span className={`text-sm font-medium ${
                                currentStore?.id === store.id ? 'text-blue-600' : 'text-gray-600'
                              }`}>
                                {getInitials(store.name)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium truncate ${
                                currentStore?.id === store.id ? 'text-blue-700' : 'text-gray-900'
                              }`}>
                                {store.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{store.location}</div>
                            </div>
                          </div>
                          {currentStore?.id === store.id && (
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Store Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleCloseAllModals}
          />
          
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden transform transition-all">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-blue-800">Create New Store</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {storeCount.remaining} of {storeCount.max_limit} slots available
                  </p>
                </div>
                <button 
                  onClick={handleCloseAllModals}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={createNewStore} className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStore.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., Airen Pharmacy - Main Branch"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStore.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., Abuja, Nigeria"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={newStore.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Full store address"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newStore.phone_number}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="+2348012345678"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newStore.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="store@example.com"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseAllModals}
                    className="px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={storeCount.remaining <= 0}
                    className={`px-6 py-3 text-sm font-medium text-white rounded-lg transition-all ${
                      storeCount.remaining <= 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    }`}
                  >
                    Create Store
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manage Stores Modal */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleCloseAllModals}
          />
          
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden transform transition-all">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-blue-800">Manage Stores</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {storeCount.count} of {storeCount.max_limit} stores
                  </p>
                </div>
                <button 
                  onClick={handleCloseAllModals}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6">
                {stores.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🛒</span>
                    </div>
                    <p className="text-sm">No stores found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stores.map((store) => (
                      <div key={store.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors bg-white shadow-sm">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            currentStore?.id === store.id ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <span className={`text-sm font-medium ${
                              currentStore?.id === store.id ? 'text-blue-600' : 'text-gray-600'
                            }`}>
                              {getInitials(store.name)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{store.name}</div>
                            <div className="text-sm text-gray-500 truncate">{store.location}</div>
                            {currentStore?.id === store.id && (
                              <div className="text-xs text-blue-600 font-medium mt-1">Current</div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setShowManageModal(false);
                              switchStore(store.id);
                            }}
                            className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                          >
                            Switch
                          </button>
                          <button
                            onClick={() => deleteStore(store.id)}
                            className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            disabled={stores.length <= 1}
                            title={stores.length <= 1 ? "Cannot delete the only store" : "Delete store"}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-end">
                <button
                  onClick={handleCloseAllModals}
                  className="px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default DesktopHeader;