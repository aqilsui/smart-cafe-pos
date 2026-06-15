import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CreditCard, DollarSign, QrCode, Split, Layers, User, ChevronRight, CheckCircle2, ListFilter
} from 'lucide-react';

const BillSplitter = () => {
  const { 
    tables, 
    activeTableId, 
    setActiveTableId,
    activeOrder, 
    fetchActiveOrder, 
    payFull, 
    payPartial, 
    payItemized 
  } = useApp();

  const [splitMode, setSplitMode] = useState('full'); // full, equal, itemized
  const [numSplits, setNumSplits] = useState(2);
  const [equalSplitsPaid, setEqualSplitsPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  
  // For itemized split: tracks quantity to pay for each order item
  // key: orderItemId, value: quantity selected
  const [selectedItems, setSelectedItems] = useState({});

  useEffect(() => {
    if (activeTableId) {
      fetchActiveOrder(activeTableId);
    }
  }, [activeTableId]);

  // Reset split state when table changes
  useEffect(() => {
    setSelectedItems({});
    setEqualSplitsPaid(0);
  }, [activeTableId]);

  const selectedTable = tables.find(t => t.id === activeTableId);

  if (!activeTableId || !selectedTable) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Split size={48} style={{ strokeWidth: 1.5, opacity: 0.3, marginBottom: '12px' }} />
        <p style={{ fontSize: '1rem', fontWeight: 500 }}>No table selected for billing.</p>
        <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Please go back to the Table Grid and select an active table.</p>
      </div>
    );
  }

  if (!activeOrder) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No active order found for Table {selectedTable.tableNumber}. Seat the table first.</p>
      </div>
    );
  }

  // Calculate payments
  const unpaidItems = activeOrder.orderItems.filter(item => item.parentSplitId !== -1 && item.status !== 'CANCELLED');
  const paidAmount = activeOrder.orderItems.filter(item => item.parentSplitId === -1).reduce((a,b) => a + (b.menuItem.price * b.quantity * 1.06), 0);
  
  // Approximate total paid so far
  // We can calculate actual paid amount from order.totalAmount minus current remaining balance if needed.
  // But let's keep it simple.
  const remainingBalance = activeOrder.totalAmount; // Backend returns the correct total unpaid amount.

  const handlePayFull = async () => {
    const success = await payFull(activeOrder.id, paymentMethod);
    if (success) {
      setActiveTableId(null);
    }
  };

  const handlePayEqualSplit = async () => {
    const splitAmount = Math.round((remainingBalance / (numSplits - equalSplitsPaid)) * 100.0) / 100.0;
    const success = await payPartial(activeOrder.id, splitAmount, paymentMethod);
    if (success) {
      setEqualSplitsPaid(prev => prev + 1);
      // Re-fetch order details
      await fetchActiveOrder(activeTableId);
    }
  };

  // Itemized split helpers
  const handleItemQtyChange = (itemId, change, maxQty) => {
    setSelectedItems(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, Math.min(maxQty, current + change));
      return { ...prev, [itemId]: next };
    });
  };

  // Calculate selected items subtotal
  let splitSubtotal = 0;
  Object.entries(selectedItems).forEach(([itemId, qty]) => {
    const item = unpaidItems.find(i => i.id === parseInt(itemId));
    if (item) {
      splitSubtotal += item.menuItem.price * qty;
    }
  });
  const splitTax = splitSubtotal * 0.06;
  const splitTotal = Math.round((splitSubtotal + splitTax) * 100.0) / 100.0;

  const handlePayItemized = async () => {
    // Filter out zero entries
    const itemsToPay = {};
    Object.entries(selectedItems).forEach(([itemId, qty]) => {
      if (qty > 0) {
        itemsToPay[itemId] = qty;
      }
    });

    if (Object.keys(itemsToPay).length === 0) {
      alert('Please select at least one item to pay for!');
      return;
    }

    const success = await payItemized(activeOrder.id, itemsToPay, paymentMethod);
    if (success) {
      setSelectedItems({});
      await fetchActiveOrder(activeTableId);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', flex: 1 }}>
      {/* Left Column: Bill Summary */}
      <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#fff' }}>
            Bill Summary - Table {selectedTable.tableNumber}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {unpaidItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--status-vacant)' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 8px auto', display: 'block' }} />
                <span>All items have been fully settled!</span>
              </div>
            ) : (
              unpaidItems.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {item.menuItem.name} <span style={{ color: '#fff', fontWeight: 600 }}>x{item.quantity}</span>
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    ${(item.menuItem.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tax (6% SST)</span>
              <span>${activeOrder.tax.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, marginTop: '8px', color: '#fff' }}>
              <span>Total Amount</span>
              <span>${activeOrder.totalAmount.toFixed(2)}</span>
            </div>
            {remainingBalance < activeOrder.totalAmount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--status-vacant)', fontWeight: 600 }}>
                <span>Paid So Far</span>
                <span>${(activeOrder.totalAmount - remainingBalance).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, marginTop: '4px', color: 'var(--secondary)' }}>
              <span>Remaining Balance</span>
              <span>${remainingBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Payment Method</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPaymentMethod('CARD')}
              style={{
                flex: 1,
                background: paymentMethod === 'CARD' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                borderColor: paymentMethod === 'CARD' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: paymentMethod === 'CARD' ? '#fff' : 'var(--text-muted)'
              }}
              className="btn-glass"
            >
              <CreditCard size={16} />
              <span>Card</span>
            </button>

            <button
              onClick={() => setPaymentMethod('CASH')}
              style={{
                flex: 1,
                background: paymentMethod === 'CASH' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                borderColor: paymentMethod === 'CASH' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: paymentMethod === 'CASH' ? '#fff' : 'var(--text-muted)'
              }}
              className="btn-glass"
            >
              <DollarSign size={16} />
              <span>Cash</span>
            </button>

            <button
              onClick={() => setPaymentMethod('QR')}
              style={{
                flex: 1,
                background: paymentMethod === 'QR' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                borderColor: paymentMethod === 'QR' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: paymentMethod === 'QR' ? '#fff' : 'var(--text-muted)'
              }}
              className="btn-glass"
            >
              <QrCode size={16} />
              <span>QR Pay</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Splitting Controls */}
      <div style={{ flex: '2 1 420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Split Mode Selector Tabs */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setSplitMode('full')}
              style={{
                flex: 1,
                background: splitMode === 'full' ? 'var(--panel-bg)' : 'transparent',
                color: splitMode === 'full' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Single Settlement
            </button>

            <button
              onClick={() => setSplitMode('equal')}
              style={{
                flex: 1,
                background: splitMode === 'equal' ? 'var(--panel-bg)' : 'transparent',
                color: splitMode === 'equal' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              <Split size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Split Evenly
            </button>

            <button
              onClick={() => setSplitMode('itemized')}
              style={{
                flex: 1,
                background: splitMode === 'itemized' ? 'var(--panel-bg)' : 'transparent',
                color: splitMode === 'itemized' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              <ListFilter size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Split by Items
            </button>
          </div>

          {/* Mode 1: Full Payment */}
          {splitMode === 'full' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={48} style={{ color: 'var(--primary)', strokeWidth: 1.5 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>Full Checkout</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Pay the entire remaining balance of <strong>${remainingBalance.toFixed(2)}</strong> using your selected payment method.
                </p>
              </div>
              <button
                onClick={handlePayFull}
                disabled={remainingBalance <= 0}
                className="btn-glass bg-gradient-primary"
                style={{ width: '100%', border: 'none', padding: '12px', justifyContent: 'center' }}
              >
                <span>Authorize & Pay ${remainingBalance.toFixed(2)}</span>
              </button>
            </div>
          )}

          {/* Mode 2: Equal Splits */}
          {splitMode === 'equal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Number of Splits:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={() => setNumSplits(Math.max(2, numSplits - 1))}
                    disabled={equalSplitsPaid > 0}
                    className="btn-glass"
                    style={{ padding: '8px' }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, width: '24px', textAlign: 'center' }}>{numSplits}</span>
                  <button 
                    onClick={() => setNumSplits(numSplits + 1)}
                    disabled={equalSplitsPaid > 0}
                    className="btn-glass"
                    style={{ padding: '8px' }}
                  >
                    +
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                    (Each: ${(remainingBalance / (numSplits - equalSplitsPaid)).toFixed(2)})
                  </span>
                </div>
              </div>

              {equalSplitsPaid > 0 && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: 'var(--status-vacant)'
                }}>
                  Paid {equalSplitsPaid} of {numSplits} splits. Remaining balance: ${remainingBalance.toFixed(2)}
                </div>
              )}

              <button
                onClick={handlePayEqualSplit}
                disabled={remainingBalance <= 0}
                className="btn-glass bg-gradient-primary"
                style={{ width: '100%', border: 'none', padding: '12px', justifyContent: 'center' }}
              >
                <span>Pay Split #{equalSplitsPaid + 1} (${(remainingBalance / (numSplits - equalSplitsPaid)).toFixed(2)})</span>
              </button>
            </div>
          )}

          {/* Mode 3: Itemized Splits */}
          {splitMode === 'itemized' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Select the quantity of each menu item being paid for in this split transaction:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
                {unpaidItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)' }}>
                    No items left to assign.
                  </div>
                ) : (
                  unpaidItems.map(item => {
                    const selectedQty = selectedItems[item.id] || 0;
                    return (
                      <div 
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px',
                          background: 'rgba(0,0,0,0.15)',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ width: '50%' }}>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>{item.menuItem.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>${item.menuItem.price.toFixed(2)} each</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleItemQtyChange(item.id, -1, item.quantity)}
                            className="btn-glass"
                            style={{ padding: '4px 8px', borderRadius: '4px' }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: '16px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                            {selectedQty}
                          </span>
                          <button
                            onClick={() => handleItemQtyChange(item.id, 1, item.quantity)}
                            className="btn-glass"
                            style={{ padding: '4px 8px', borderRadius: '4px' }}
                          >
                            +
                          </button>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '4px' }}>
                            / max {item.quantity}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {splitTotal > 0 && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.9rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>This Split Subtotal: </span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>${splitSubtotal.toFixed(2)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--secondary)', fontWeight: 800 }}>Total: ${splitTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handlePayItemized}
                disabled={splitTotal <= 0}
                className="btn-glass bg-gradient-primary"
                style={{ width: '100%', border: 'none', padding: '12px', justifyContent: 'center' }}
              >
                <span>Process Sub-bill Payment (${splitTotal.toFixed(2)})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillSplitter;
