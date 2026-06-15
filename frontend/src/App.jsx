import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import TableGrid from './components/TableGrid';
import KitchenQueue from './components/KitchenQueue';
import BillSplitter from './components/BillSplitter';

const AppContent = () => {
  const { activeView } = useApp();

  return (
    <Layout>
      {activeView === 'dashboard' && <TableGrid />}
      {activeView === 'kitchen' && <KitchenQueue />}
      {activeView === 'billing' && <BillSplitter />}
    </Layout>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
