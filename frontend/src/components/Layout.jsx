import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, ChefHat, CreditCard, BrainCircuit, AlertTriangle, Moon } from 'lucide-react';

const Layout = ({ children }) => {
  const { activeView, setActiveView, kitchenMetrics } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'POS Dashboard', icon: LayoutDashboard },
    { id: 'kitchen', label: 'Kitchen Queue', icon: ChefHat, badge: kitchenMetrics.pendingCount + kitchenMetrics.cookingCount },
    { id: 'billing', label: 'Billing & Split', icon: CreditCard },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="glass-panel" style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        borderRadius: 0,
        borderLeft: 'none',
        borderTop: 'none',
        borderBottom: 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100
      }}>
        {/* Logo / Brand */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div className="bg-gradient-primary" style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <BrainCircuit size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.5px' }}>
              <span className="text-gradient">CAFE</span> <span style={{ color: '#fff' }}>POS</span>
            </h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>AI Smart System</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '16px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                style={{
                  width: '100%',
                  background: isActive ? 'var(--primary-glow)' : 'transparent',
                  border: '1px solid',
                  borderColor: isActive ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 600 : 500,
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                className={!isActive ? 'glass-card-interactive' : ''}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    position: 'absolute',
                    right: '16px',
                    background: item.id === 'kitchen' && kitchenMetrics.isFallingBehind ? 'var(--status-cancelled)' : 'var(--primary)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--panel-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {kitchenMetrics.isFallingBehind && (
            <div className="kitchen-warning" style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--status-cancelled)'
            }}>
              <AlertTriangle size={16} />
              <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                <span style={{ fontWeight: 700 }}>Kitchen Delay!</span>
                <br />
                Load is bottlenecked.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }} />
            <span style={{ color: 'var(--text-muted)' }}>Database Connected</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-content">
        {/* Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--panel-border)',
          marginBottom: '24px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
              {activeView === 'dashboard' && 'Dining & POS Overview'}
              {activeView === 'kitchen' && 'Kitchen Order Queue (KDS)'}
              {activeView === 'billing' && 'Billing & Split Checkout'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {activeView === 'dashboard' && 'Manage tables, seat guests, and take orders'}
              {activeView === 'kitchen' && 'Track incoming orders and monitor kitchen delays'}
              {activeView === 'billing' && 'Process payment transactions and split bills'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Realtime Kitchen Load Index */}
            <div className="glass-panel" style={{
              padding: '6px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Kitchen Load:</span>
              <span style={{ 
                fontWeight: 700,
                color: kitchenMetrics.bottleneckScore > 7.0 ? 'var(--status-cancelled)' : 
                       kitchenMetrics.bottleneckScore > 4.0 ? 'var(--status-occupied)' : 'var(--status-vacant)'
              }}>
                {kitchenMetrics.bottleneckScore}/10
              </span>
            </div>

            <div className="glass-panel" style={{
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}>
              <Moon size={18} />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
