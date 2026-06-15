import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import OrderPad from './OrderPad';
import { Users, LogIn, LogOut, Receipt } from 'lucide-react';

const TableGrid = () => {
  const { 
    tables, 
    activeTableId, 
    setActiveTableId, 
    activeOrder, 
    fetchActiveOrder, 
    seatTable, 
    vacateTable, 
    setActiveView 
  } = useApp();

  // Load active order details whenever active table changes
  useEffect(() => {
    if (activeTableId) {
      fetchActiveOrder(activeTableId);
    }
  }, [activeTableId]);

  const selectedTable = tables.find(t => t.id === activeTableId);

  const handleTableClick = (tableId) => {
    setActiveTableId(tableId);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'VACANT': return 'badge-vacant';
      case 'OCCUPIED': return 'badge-occupied';
      case 'PAYING': return 'badge-paying';
      default: return 'badge-pending';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
      {/* Table Map Section */}
      <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600 }}>Dining Room Layout</h3>
          
          <div className="grid-layout" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {tables.map(table => {
              const isSelected = activeTableId === table.id;
              const hasOrder = table.status !== 'VACANT';
              
              return (
                <div
                  key={table.id}
                  onClick={() => handleTableClick(table.id)}
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    borderColor: isSelected ? 'var(--primary)' : 'var(--panel-border)',
                    background: isSelected ? 'rgba(139, 92, 246, 0.08)' : 'var(--panel-bg)',
                    boxShadow: isSelected ? '0 0 15px var(--primary-glow)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  {/* Table Circle Visualizer */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: hasOrder ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.02)',
                    border: '2px dashed',
                    borderColor: hasOrder ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#fff'
                  }}>
                    {table.tableNumber}
                  </div>

                  <div>
                    <span className={`badge ${getStatusClass(table.status)}`}>
                      {table.status}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)'
                  }}>
                    <Users size={14} />
                    <span>Cap: {table.capacity} pax</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Side Detail Panel (Selected Table Context) */}
      <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column' }}>
        {selectedTable ? (
          <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Table {selectedTable.tableNumber}</h3>
                <span className={`badge ${getStatusClass(selectedTable.status)}`}>{selectedTable.status}</span>
              </div>
              
              {selectedTable.status !== 'VACANT' && (
                <button 
                  onClick={() => vacateTable(selectedTable.id)}
                  className="btn-glass"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    color: 'var(--status-cancelled)',
                    borderColor: 'rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <LogOut size={14} />
                  <span>Force Vacate</span>
                </button>
              )}
            </div>

            {selectedTable.status === 'VACANT' ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                padding: '40px 0',
                color: 'var(--text-muted)'
              }}>
                <Users size={48} style={{ strokeWidth: 1.5, opacity: 0.3 }} />
                <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>Table is currently empty.</p>
                <button
                  onClick={() => seatTable(selectedTable.id)}
                  className="btn-glass bg-gradient-primary"
                  style={{ width: '100%', border: 'none', padding: '12px' }}
                >
                  <LogIn size={16} />
                  <span>Seat Guests & Start Order</span>
                </button>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeOrder ? (
                  <>
                    <div style={{
                      padding: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Receipt size={16} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Running Bill:</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
                        ${activeOrder.totalAmount.toFixed(2)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setActiveView('billing')}
                        className="btn-glass"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <Receipt size={16} />
                        <span>Go to Checkout</span>
                      </button>
                    </div>

                    <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <OrderPad />
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    Loading active order details...
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel" style={{
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}>
            <Users size={32} style={{ strokeWidth: 1.5, opacity: 0.3, marginBottom: '12px' }} />
            <p style={{ fontSize: '0.9rem' }}>Select a table from the dining floor layout to start ordering or checkout.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableGrid;
