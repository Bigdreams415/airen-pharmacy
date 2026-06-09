// Sidebar.tsx
import React from 'react';
import { PageType } from '../../types/navigation';

interface SidebarProps {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
  onMobileItemClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, onMobileItemClick }) => {
  const menuItems = [
    { id: 'dashboard' as PageType, label: 'Dashboard', icon: '📊' },
    { id: 'pos' as PageType, label: 'Point of Sale', icon: '💳' },
    { id: 'inventory' as PageType, label: 'Inventory', icon: '📦' },
    { id: 'SalesHistory' as PageType, label: 'Sales History', icon: '🛒' },
    { id: 'Ledger' as PageType, label: 'Ledger', icon: '💰' },
    { id: 'services' as PageType, label: 'Services', icon: '🛠️' },
    { id: 'admin' as PageType, label: 'Admin', icon: '🔒' },
    { id: 'account' as PageType, label: 'Account', icon: '👤' },
    { id: 'settings' as PageType, label: 'Settings', icon: '⚙️' },
  ];

  const handleItemClick = (page: PageType) => {
    setActivePage(page);
    if (onMobileItemClick) {
      onMobileItemClick();
    }
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-700 h-full flex flex-col shadow-xl">
      {/* Close Button - Mobile Only */}
      <div className="lg:hidden p-4 border-b border-slate-700 flex justify-end">
        <button
          onClick={onMobileItemClick}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close menu"
        >
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Store Status */}
      <div className="p-6 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
          <span className="text-xs text-blue-400 font-medium">Online • v1.0.0</span>
        </div>
      </div>

      {/* Scrollable Navigation Container */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <nav className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
          <div className="mb-4 px-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Navigation</h3>
          </div>

          <ul className="space-y-1 pr-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left group ${
                    activePage === item.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                  }`}
                >
                  <span className={`text-xl flex-shrink-0 transition-transform group-hover:scale-110 ${
                    activePage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                  {activePage === item.id && (
                    <div className="ml-auto w-2 h-2 bg-blue-300 rounded-full"></div>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="my-6 px-3">
            <div className="border-t border-slate-700"></div>
          </div>

          {/* Quick Links */}
          <div className="px-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Links</h3>
            <div className="space-y-1">
              <button className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-lg transition-colors">
                📈 Today's Report
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-lg transition-colors">
                🔔 Notifications
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-lg transition-colors">
                ❓ Help & Support
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="p-4 border-t border-slate-700 bg-slate-900 shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-sm font-medium text-slate-200">Airen Pharmacy</p>
            <p className="text-xs text-slate-400">© 2026 • v1.0.0</p>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-800">
            <span className="font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">AP</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
