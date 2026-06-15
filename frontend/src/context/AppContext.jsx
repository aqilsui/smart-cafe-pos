import React, { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

const API_BASE = 'http://localhost:8085/api';

export const AppProvider = ({ children }) => {
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [activeTableId, setActiveTableId] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [cart, setCart] = useState([]); // Array of { menuItemId, name, price, quantity, notes }
  const [kitchenQueue, setKitchenQueue] = useState([]);
  const [kitchenMetrics, setKitchenMetrics] = useState({
    pendingCount: 0,
    cookingCount: 0,
    averageWaitMinutes: 0,
    bottleneckScore: 0,
    isFallingBehind: false
  });
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, kitchen, billing, ai-insights
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [etaDetails, setEtaDetails] = useState(null);

  // Initial data loading
  useEffect(() => {
    fetchTables();
    fetchMenu();
    fetchKitchenQueue();
    fetchKitchenMetrics();
  }, []);

  // Poll kitchen data every 5 seconds if we are on the kitchen view
  useEffect(() => {
    let interval = null;
    if (activeView === 'kitchen' || activeView === 'dashboard') {
      interval = setInterval(() => {
        fetchKitchenQueue();
        fetchKitchenMetrics();
        fetchTables(); // Refresh table states too
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeView]);

  // Fetch tables list
  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_BASE}/tables`);
      if (res.ok) {
        const data = await res.json();
        setTables(data.sort((a, b) => a.tableNumber - b.tableNumber));
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  // Fetch menu
  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/menu`);
      if (res.ok) {
        const data = await res.json();
        setMenu(data);
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
    }
  };

  // Fetch active order for selected table
  const fetchActiveOrder = async (tableId) => {
    if (!tableId) return null;
    try {
      const res = await fetch(`${API_BASE}/orders/table/${tableId}/active`);
      if (res.ok) {
        const data = await res.json();
        setActiveOrder(data);
        fetchRecommendationsForCart(data.orderItems.map(oi => oi.menuItem.id));
        return data;
      } else {
        setActiveOrder(null);
        return null;
      }
    } catch (err) {
      console.error('Error fetching active order:', err);
      setActiveOrder(null);
      return null;
    }
  };

  // Seat customer
  const seatTable = async (tableId) => {
    try {
      const res = await fetch(`${API_BASE}/tables/${tableId}/seat`, { method: 'POST' });
      if (res.ok) {
        await fetchTables();
        // Automatically start an order
        await startOrder(tableId);
      }
    } catch (err) {
      console.error('Error seating table:', err);
    }
  };

  // Vacate table
  const vacateTable = async (tableId) => {
    try {
      const res = await fetch(`${API_BASE}/tables/${tableId}/vacate`, { method: 'POST' });
      if (res.ok) {
        await fetchTables();
        setActiveOrder(null);
      }
    } catch (err) {
      console.error('Error vacating table:', err);
    }
  };

  // Start order
  const startOrder = async (tableId) => {
    try {
      const res = await fetch(`${API_BASE}/orders/table/${tableId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setActiveOrder(data);
        setActiveTableId(tableId);
        setCart([]);
      }
    } catch (err) {
      console.error('Error starting order:', err);
    }
  };

  // Mid-meal update: add cart items to active database order
  const submitCartToOrder = async () => {
    if (!activeOrder || cart.length === 0) return;
    try {
      let updatedOrder = null;
      for (const item of cart) {
        const res = await fetch(`${API_BASE}/orders/${activeOrder.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes
          })
        });
        if (res.ok) {
          updatedOrder = await res.json();
        }
      }
      if (updatedOrder) {
        setActiveOrder(updatedOrder);
        setCart([]);
        fetchTables();
        fetchKitchenQueue();
        alert('Order updated successfully and items sent to kitchen!');
      }
    } catch (err) {
      console.error('Error submitting cart:', err);
    }
  };

  // Modify active order item quantity mid-meal
  const updateOrderItemQuantity = async (orderItemId, newQty) => {
    if (!activeOrder) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${activeOrder.id}/items/${orderItemId}?quantity=${newQty}`, {
        method: 'PUT'
      });
      if (res.ok) {
        const data = await res.json();
        setActiveOrder(data);
        fetchKitchenQueue();
      }
    } catch (err) {
      console.error('Error updating order item:', err);
    }
  };

  // Cancel active order item mid-meal
  const cancelOrderItem = async (orderItemId) => {
    if (!activeOrder) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${activeOrder.id}/items/${orderItemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setActiveOrder(data);
        fetchKitchenQueue();
      }
    } catch (err) {
      console.error('Error cancelling order item:', err);
    }
  };

  // Kitchen operations
  const fetchKitchenQueue = async () => {
    try {
      const res = await fetch(`${API_BASE}/kitchen/queue`);
      if (res.ok) {
        const data = await res.json();
        setKitchenQueue(data);
      }
    } catch (err) {
      console.error('Error fetching kitchen queue:', err);
    }
  };

  const fetchKitchenMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/kitchen/metrics`);
      if (res.ok) {
        const data = await res.json();
        setKitchenMetrics(data);
      }
    } catch (err) {
      console.error('Error fetching kitchen metrics:', err);
    }
  };

  const updateKitchenItemStatus = async (orderItemId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/kitchen/items/${orderItemId}/status?status=${newStatus}`, {
        method: 'PUT'
      });
      if (res.ok) {
        await fetchKitchenQueue();
        await fetchKitchenMetrics();
        if (activeTableId) {
          await fetchActiveOrder(activeTableId);
        }
        await fetchTables();
      }
    } catch (err) {
      console.error('Error updating kitchen item status:', err);
    }
  };

  // Payments / Billing operations
  const payFull = async (orderId, method) => {
    try {
      const res = await fetch(`${API_BASE}/payments/order/${orderId}/pay-full?method=${method}`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchTables();
        setActiveOrder(null);
        setActiveTableId(null);
        alert('Order fully paid! Table is now vacated.');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error processing full payment:', err);
      return false;
    }
  };

  const payPartial = async (orderId, amount, method) => {
    try {
      const res = await fetch(`${API_BASE}/payments/order/${orderId}/pay-partial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method })
      });
      if (res.ok) {
        await fetchTables();
        if (activeTableId) {
          await fetchActiveOrder(activeTableId);
        }
        alert(`Partial payment of $${amount} successful.`);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error processing partial payment:', err);
      return false;
    }
  };

  const payItemized = async (orderId, itemPayments, method) => {
    try {
      const res = await fetch(`${API_BASE}/payments/order/${orderId}/pay-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemPayments, method })
      });
      if (res.ok) {
        await fetchTables();
        if (activeTableId) {
          await fetchActiveOrder(activeTableId);
        }
        alert('Itemized payment successful.');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error processing itemized payment:', err);
      return false;
    }
  };

  // AI Helpers
  const parseVoiceOrder = async (text) => {
    try {
      const res = await fetch(`${API_BASE}/ai/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const data = await res.json();
        
        // Handle table matching
        if (data.tableNumber) {
          const matchedTable = tables.find(t => t.tableNumber === data.tableNumber);
          if (matchedTable) {
            setActiveTableId(matchedTable.id);
            await fetchActiveOrder(matchedTable.id);
            // If table is vacant, seat them first
            if (matchedTable.status === 'VACANT') {
              await seatTable(matchedTable.id);
            }
          }
        }

        // Add items to local cart
        if (data.items && data.items.length > 0) {
          const newCartItems = data.items.map(item => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || ''
          }));
          setCart(prev => [...prev, ...newCartItems]);
          // Fetch recommendations and ETA for the new cart items
          const itemIds = [...cart, ...newCartItems].map(item => item.menuItemId);
          fetchEtaForCart(itemIds);
          fetchRecommendationsForCart(itemIds);
        }
        return data;
      }
    } catch (err) {
      console.error('Error parsing voice order:', err);
    }
  };

  const fetchEtaForCart = async (menuItemIds) => {
    if (menuItemIds.length === 0) {
      setEtaDetails(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/ai/eta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemIds })
      });
      if (res.ok) {
        const data = await res.json();
        setEtaDetails(data);
      }
    } catch (err) {
      console.error('Error fetching ETA:', err);
    }
  };

  const fetchRecommendationsForCart = async (menuItemIds) => {
    try {
      const res = await fetch(`${API_BASE}/ai/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemIds })
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendedItems(data);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  // Add item manually to cart
  const addItemToCart = (menuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItemId === menuItem.id);
      let updated;
      if (existing) {
        updated = prev.map(item =>
          item.menuItemId === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updated = [...prev, {
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          notes: ''
        }];
      }
      // Re-fetch recommendations and ETA based on updated cart
      const itemIds = updated.map(item => item.menuItemId);
      fetchEtaForCart(itemIds);
      fetchRecommendationsForCart(itemIds);
      return updated;
    });
  };

  const updateCartQty = (menuItemId, qty) => {
    if (qty <= 0) {
      setCart(prev => {
        const updated = prev.filter(item => item.menuItemId !== menuItemId);
        const itemIds = updated.map(item => item.menuItemId);
        fetchEtaForCart(itemIds);
        fetchRecommendationsForCart(itemIds);
        return updated;
      });
    } else {
      setCart(prev => {
        const updated = prev.map(item =>
          item.menuItemId === menuItemId ? { ...item, quantity: qty } : item
        );
        const itemIds = updated.map(item => item.menuItemId);
        fetchEtaForCart(itemIds);
        fetchRecommendationsForCart(itemIds);
        return updated;
      });
    }
  };

  const updateCartItemNotes = (menuItemId, notes) => {
    setCart(prev => prev.map(item =>
      item.menuItemId === menuItemId ? { ...item, notes } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    setEtaDetails(null);
  };

  return (
    <AppContext.Provider value={{
      tables,
      menu,
      activeTableId,
      setActiveTableId,
      activeOrder,
      setActiveOrder,
      cart,
      setCart,
      kitchenQueue,
      kitchenMetrics,
      activeView,
      setActiveView,
      recommendedItems,
      etaDetails,
      fetchActiveOrder,
      seatTable,
      vacateTable,
      startOrder,
      submitCartToOrder,
      updateOrderItemQuantity,
      cancelOrderItem,
      updateKitchenItemStatus,
      payFull,
      payPartial,
      payItemized,
      parseVoiceOrder,
      fetchEtaForCart,
      fetchRecommendationsForCart,
      addItemToCart,
      updateCartQty,
      updateCartItemNotes,
      clearCart
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
