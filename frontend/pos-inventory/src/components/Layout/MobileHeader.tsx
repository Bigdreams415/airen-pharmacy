// MobileHeader.tsx
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';

interface Store {
  id: string;
  name: string;
  location: string;
}

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuToggle }) => {
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);

  useEffect(() => {
    fetchCurrentStore();
  }, []);

  const fetchCurrentStore = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pharmacy/current`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCurrentStore(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching store:', error);
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

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Hamburger Menu + Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">ST</span>
            </div>
            <span className="text-lg font-bold text-blue-700">
              Airen Pharmacy
            </span>
          </div>
        </div>

        {/* Right: Store Selector */}
        <button 
          onClick={() => setShowStoreModal(true)}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors group border border-blue-200"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center group-hover:from-blue-600 group-hover:to-indigo-700 transition-all shadow-sm">
            <span className="text-white font-semibold text-xs">
              {currentStore ? getInitials(currentStore.name) : 'ST'}
            </span>
          </div>
        </button>
      </div>

      {/* Store Modal - Mobile Optimized */}
      {showStoreModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowStoreModal(false)}
          />
          
          <div className="relative bg-white rounded-t-2xl shadow-xl w-full max-h-[70vh] overflow-hidden z-10">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-blue-800">Current Store</h3>
                <button 
                  onClick={() => setShowStoreModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              {currentStore ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-semibold text-lg">
                      {getInitials(currentStore.name)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-800">{currentStore.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{currentStore.location}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-gray-400 text-2xl">🛒</span>
                  </div>
                  <p className="text-sm">No store selected</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowStoreModal(false)}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default MobileHeader;