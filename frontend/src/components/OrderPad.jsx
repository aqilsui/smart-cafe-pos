import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, Minus, ShoppingCart, Send, Mic, Sparkles, Clock, HelpCircle, X, Check
} from 'lucide-react';

const OrderPad = () => {
  const {
    menu,
    activeOrder,
    cart,
    addItemToCart,
    updateCartQty,
    updateCartItemNotes,
    clearCart,
    submitCartToOrder,
    updateOrderItemQuantity,
    cancelOrderItem,
    parseVoiceOrder,
    etaDetails,
    recommendedItems
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [voiceText, setVoiceText] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [showAiConsole, setShowAiConsole] = useState(false);

  const categories = ['ALL', 'COFFEE', 'TEA', 'FOOD', 'DESSERT'];

  const filteredMenu = selectedCategory === 'ALL'
    ? menu
    : menu.filter(item => item.category === selectedCategory);

  const samplePrompts = [
    "Table 3 wants 2 latte with oat milk and a blueberry muffin",
    "I need a beef burger and a peach ice tea",
    "Let's add three cappuccino and a chocolate cake",
    "Table 5 needs an americano and avocado sourdough toast"
  ];

  const handleVoiceSubmit = async (textToSend) => {
    const promptText = textToSend || voiceText;
    if (!promptText.trim()) return;

    setIsAiParsing(true);
    try {
      const result = await parseVoiceOrder(promptText);
      setVoiceText('');
      if (result && result.items && result.items.length > 0) {
        alert(`AI parsed: ${result.items.length} items added to cart!`);
      } else {
        alert('AI could not recognize any items in that text. Try a sample prompt!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiParsing(false);
    }
  };

  const getKitchenItemBadge = (status) => {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'COOKING': return 'badge-cooking';
      case 'COMPLETED': return 'badge-ready';
      case 'CANCELLED': return 'badge-cancelled';
      default: return 'badge-pending';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      
      {/* AI Assistant Toggle Button */}
      <button 
        onClick={() => setShowAiConsole(!showAiConsole)}
        className="btn-glass pulse-primary-glow"
        style={{
          background: 'rgba(139, 92, 246, 0.15)',
          borderColor: 'var(--primary)',
          color: '#fff',
          justifyContent: 'center',
          padding: '8px 12px',
          fontSize: '0.85rem'
        }}
      >
        <Sparkles size={16} style={{ color: 'var(--primary)' }} />
        <span>{showAiConsole ? 'Hide AI Voice Ordering' : 'Try AI Voice Ordering'}</span>
      </button>

      {/* AI Voice/Text Input Console */}
      {showAiConsole && (
        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.04)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BrainIcon size={14} /> Smart AI Order Assistant
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Powered by Local NLP</span>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Type or click a preset statement. The AI will extract the items, quantities, custom adjustments, and automatically load them into the POS order cart!
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              className="input-glass"
              placeholder='e.g., "2 latte and a chocolate croissant"'
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              style={{ flex: 1, fontSize: '0.85rem', padding: '8px 12px' }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleVoiceSubmit(); }}
            />
            <button
              onClick={() => handleVoiceSubmit()}
              disabled={isAiParsing}
              className="btn-glass bg-gradient-primary"
              style={{ border: 'none', padding: '8px 14px' }}
            >
              <Send size={14} />
            </button>
          </div>

          {/* Quick presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Sample Prompts (Click to test):</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleVoiceSubmit(prompt)}
                  className="btn-glass"
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cart details & additions */}
      {cart.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.01)', borderColor: 'var(--primary-glow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShoppingCart size={14} /> Pending Cart ({cart.reduce((a,b)=>a+b.quantity, 0)} items)
            </h4>
            <button 
              onClick={clearCart}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              Clear
            </button>
          </div>

          {/* Cart list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', marginBottom: '12px' }}>
            {cart.map(item => (
              <div key={item.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '55%' }}>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  <input
                    type="text"
                    placeholder="Add customization notes..."
                    value={item.notes}
                    onChange={(e) => updateCartItemNotes(item.menuItemId, e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      color: 'var(--text-muted)',
                      fontSize: '0.7rem',
                      outline: 'none',
                      padding: '2px 0'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => updateCartQty(item.menuItemId, item.quantity - 1)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '4px', width: '20px', height: '20px', color: '#fff', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ width: '16px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                  <button 
                    onClick={() => updateCartQty(item.menuItemId, item.quantity + 1)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '4px', width: '20px', height: '20px', color: '#fff', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>

                <span style={{ width: '50px', textAlign: 'right', fontWeight: 600 }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* AI Cart Insights (ETA & Recommendations) */}
          {etaDetails && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '10px',
              marginBottom: '10px'
            }}>
              <Clock size={12} style={{ color: 'var(--primary)' }} />
              <span>AI Dynamic ETA: ~{etaDetails.estimatedPrepTimeMinutes} mins</span>
              {etaDetails.isKitchenBusy && (
                <span style={{ color: 'var(--status-occupied)', fontWeight: 600 }}>(Kitchen Busy)</span>
              )}
            </div>
          )}

          {/* AI Recommended Cross-Selling */}
          {recommendedItems.length > 0 && (
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '10px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <Sparkles size={10} /> Smart Pairing Recommendations:
              </span>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                {recommendedItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addItemToCart(item)}
                    className="btn-glass"
                    style={{
                      fontSize: '0.7rem',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: 'rgba(139, 92, 246, 0.05)',
                      borderColor: 'rgba(139, 92, 246, 0.15)',
                      flexShrink: 0
                    }}
                  >
                    + {item.name} (${item.price.toFixed(2)})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Cart */}
          <button
            onClick={submitCartToOrder}
            className="btn-glass bg-gradient-primary"
            style={{ width: '100%', border: 'none', justifyContent: 'center', padding: '10px' }}
          >
            Send Order Additions to Kitchen
          </button>
        </div>
      )}

      {/* Menu Catalog Section */}
      <div className="glass-panel" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Menu Catalog</h4>
        
        {/* Category Selector */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '10px',
          maxHeight: '220px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {filteredMenu.map(item => (
            <div
              key={item.id}
              onClick={() => addItemToCart(item)}
              className="glass-card-interactive"
              style={{
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '90px',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)' }}>
                  ${item.price.toFixed(2)}
                </span>
                <div style={{
                  background: 'var(--primary)',
                  borderRadius: '4px',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <Plus size={10} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Order History / Modifying active orders mid-meal */}
      {activeOrder && activeOrder.orderItems && activeOrder.orderItems.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Active Bill Items (Mid-Meal Status)</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {activeOrder.orderItems.map(item => {
              // Unpaid items have parentSplitId != -1
              const isPaid = item.parentSplitId === -1;
              const isCancelled = item.status === 'CANCELLED';
              const canModify = !isPaid && !isCancelled && item.status === 'PENDING';

              return (
                <div 
                  key={item.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    fontSize: '0.8rem',
                    opacity: isCancelled ? 0.4 : isPaid ? 0.7 : 1,
                    background: isPaid ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    border: isPaid ? '1px dashed rgba(16, 185, 129, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', width: '50%' }}>
                    <span style={{ fontWeight: 600, textDecoration: isCancelled ? 'line-through' : 'none' }}>
                      {item.menuItem.name} {isPaid && <span style={{ color: 'var(--status-vacant)', fontSize: '0.7rem', fontWeight: 700 }}>(PAID)</span>}
                    </span>
                    {item.notes && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>* {item.notes}</span>}
                  </div>

                  {/* Quantity and status checks */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700 }}>Qty: {item.quantity}</span>
                    
                    <span className={`badge ${getKitchenItemBadge(item.status)}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                      {item.status}
                    </span>

                    {/* Mid-meal cancellation/reduction if still pending in kitchen */}
                    {canModify && (
                      <button
                        onClick={() => cancelOrderItem(item.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: 'var(--status-cancelled)',
                          borderRadius: '4px',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Cancel item"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper BrainIcon Component inside
const BrainIcon = ({ size }) => {
  return <Sparkles size={size} style={{ color: 'var(--primary)' }} />;
};

export default OrderPad;
