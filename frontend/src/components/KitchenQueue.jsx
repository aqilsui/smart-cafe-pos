import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Check, Clock, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';

const KitchenQueue = () => {
  const { 
    kitchenQueue, 
    kitchenMetrics, 
    updateKitchenItemStatus, 
    fetchKitchenQueue, 
    fetchKitchenMetrics 
  } = useApp();

  // State to force re-render every second for real-time elapsed timers
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Group kitchen items by order/table to render tickets
  const ticketsMap = {};
  kitchenQueue.forEach(item => {
    const orderId = item.order.id;
    if (!ticketsMap[orderId]) {
      ticketsMap[orderId] = {
        orderId: orderId,
        tableNumber: item.order.table.tableNumber,
        createdAt: item.order.createdAt,
        items: []
      };
    }
    ticketsMap[orderId].items.push(item);
  });

  const tickets = Object.values(ticketsMap).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const calculateElapsedSeconds = (createdAtStr) => {
    if (!createdAtStr) return 0;
    const diff = new Date().getTime() - new Date(createdAtStr).getTime();
    return Math.max(0, Math.floor(diff / 1000));
  };

  const formatElapsed = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  const handleRefresh = () => {
    fetchKitchenQueue();
    fetchKitchenMetrics();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      {/* Metrics Header */}
      <div className="grid-layout" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--status-pending)', padding: '10px', borderRadius: '10px' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Tickets</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{kitchenMetrics.pendingCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-cooking)', padding: '10px', borderRadius: '10px' }}>
            <Play size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cooking Items</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{kitchenMetrics.cookingCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-ready)', padding: '10px', borderRadius: '10px' }}>
            <Check size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avg. Prep Wait</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{kitchenMetrics.averageWaitMinutes}m</div>
          </div>
        </div>

        <div 
          className="glass-panel" 
          style={{ 
            padding: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            background: kitchenMetrics.isFallingBehind ? 'rgba(239, 68, 68, 0.12)' : 'var(--panel-bg)',
            borderColor: kitchenMetrics.isFallingBehind ? 'var(--status-cancelled)' : 'var(--panel-border)'
          }}
        >
          <div style={{ 
            background: kitchenMetrics.isFallingBehind ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.02)', 
            color: kitchenMetrics.isFallingBehind ? 'var(--status-cancelled)' : 'var(--text-muted)', 
            padding: '10px', 
            borderRadius: '10px' 
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kitchen Status</div>
            <div style={{ 
              fontSize: '1.2rem', 
              fontWeight: 800,
              color: kitchenMetrics.isFallingBehind ? 'var(--status-cancelled)' : 'var(--status-vacant)'
            }}>
              {kitchenMetrics.isFallingBehind ? 'FALLING BEHIND' : 'ON TRACK'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Chef Tickets</h3>
        <button onClick={handleRefresh} className="btn-glass" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <RefreshCw size={12} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tickets Grid */}
      {tickets.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '60px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ChefHatIcon size={48} style={{ opacity: 0.2 }} />
          <p style={{ fontSize: '1rem', fontWeight: 500 }}>No pending orders in the kitchen.</p>
          <p style={{ fontSize: '0.85rem' }}>Send some orders from the dining floor POS dashboard.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
          alignItems: 'start'
        }}>
          {tickets.map(ticket => {
            // Check if any items in this ticket are overdue
            let isTicketOverdue = false;
            ticket.items.forEach(item => {
              const elapsed = calculateElapsedSeconds(item.createdAt);
              if (elapsed > item.menuItem.prepTime) {
                isTicketOverdue = true;
              }
            });

            return (
              <div 
                key={ticket.orderId} 
                className={`glass-panel ${isTicketOverdue ? 'kitchen-warning' : ''}`}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* Ticket Header */}
                <div style={{
                  padding: '14px 16px',
                  background: isTicketOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid var(--panel-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>TABLE {ticket.tableNumber}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>#Order-{ticket.orderId}</span>
                  </div>
                  
                  {isTicketOverdue && (
                    <span style={{
                      color: 'var(--status-cancelled)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <AlertCircle size={12} />
                      OVERDUE
                    </span>
                  )}
                </div>

                {/* Ticket Items List */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {ticket.items.map(item => {
                    const elapsed = calculateElapsedSeconds(item.createdAt);
                    const isOverdue = elapsed > item.menuItem.prepTime;
                    
                    return (
                      <div 
                        key={item.id} 
                        style={{
                          padding: '10px',
                          background: 'rgba(0,0,0,0.15)',
                          borderRadius: '8px',
                          borderLeft: '4px solid',
                          borderLeftColor: item.status === 'COOKING' ? 'var(--status-cooking)' : 'var(--status-pending)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ width: '60%' }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                            {item.menuItem.name} <span style={{ color: 'var(--secondary)' }}>x{item.quantity}</span>
                          </div>
                          {item.notes && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--status-occupied)', marginTop: '2px', fontWeight: 500 }}>
                              * {item.notes}
                            </div>
                          )}
                          
                          {/* Wait indicators */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={10} />
                              Wait: <span style={{ color: isOverdue ? 'var(--status-cancelled)' : 'var(--text-main)', fontWeight: 600 }}>{formatElapsed(elapsed)}</span>
                            </span>
                            <span>/</span>
                            <span>Est: {formatElapsed(item.menuItem.prepTime)}</span>
                          </div>
                        </div>

                        {/* Prep Stage Actions */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {item.status === 'PENDING' ? (
                            <button
                              onClick={() => updateKitchenItemStatus(item.id, 'COOKING')}
                              className="btn-glass"
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.75rem',
                                color: 'var(--status-cooking)',
                                borderColor: 'rgba(245, 158, 11, 0.2)'
                              }}
                            >
                              <Play size={12} />
                              <span>Cook</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => updateKitchenItemStatus(item.id, 'COMPLETED')}
                              className="btn-glass"
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.75rem',
                                color: 'var(--status-ready)',
                                borderColor: 'rgba(16, 185, 129, 0.2)'
                              }}
                            >
                              <Check size={12} />
                              <span>Done</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ChefHatIcon = ({ size, style }) => <ChefHat size={size} style={style} />;

export default KitchenQueue;
