// Layout.tsx
import React, { useState } from 'react';
import Header from './Header'; // ← CHANGE: Import main Header, not DesktopHeader
import Sidebar from './Sidebar';
import { PageType } from '../../types/navigation';

interface LayoutProps {
  children: React.ReactNode;
  activePage: PageType;
  setActivePage: (page: PageType) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, setActivePage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* CHANGE: Header now handles mobile/desktop automatically */}
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile unless open */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar 
            activePage={activePage} 
            setActivePage={setActivePage}
            onMobileItemClick={() => setSidebarOpen(false)}
          />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;