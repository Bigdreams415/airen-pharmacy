import React, { useState } from 'react';
import Gatekeeper from './components/Gatekeeper';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import PointOfSale from './pages/PointOfSale';
import Inventory from './pages/Inventory';
import Sales from './pages/Ledger';
import Services from './pages/Services';
import { PageType } from './types/navigation';
import AdminPage from './pages/Admin';
import Settings from './pages/Settings';
import Account from './pages/Account';
import SalesHistory from './pages/SalesHistory';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('pos');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <PointOfSale />;
      case 'inventory':
        return <Inventory />;
        case 'SalesHistory':
        return <SalesHistory />;
      case 'Ledger':
        return <Sales />;
      case 'services':
        return <Services />;
      case 'admin':
        return <AdminPage />;
      case 'settings':
        return <Settings />;
      case 'account':
        return <Account />;
      default:
        return <PointOfSale />;
    }
  };

  return (
    <Gatekeeper>
      <Layout activePage={currentPage} setActivePage={setCurrentPage}>
        {renderPage()}
      </Layout>
    </Gatekeeper>
  );
}

export default App;