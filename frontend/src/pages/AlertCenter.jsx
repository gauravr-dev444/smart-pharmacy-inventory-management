import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertTriangle, Calendar, TrendingDown, CheckCircle2, Package, Check 
} from 'lucide-react';

const AlertCenter = () => {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  
  // Reorder modal states
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedSug, setSelectedSug] = useState(null);
  const [orderQty, setOrderQty] = useState(100);
  const [orderSuccess, setOrderSuccess] = useState('');
  const [sendingOrder, setSendingOrder] = useState(false);

  useEffect(() => {
    fetchAlerts();
    fetchSuppliers();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error("Error loading alerts", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error("Error loading suppliers", err);
    }
  };

  const handleReorderClick = (sug) => {
    setSelectedSug(sug);
    setOrderQty(sug.recommended_reorder);
    setOrderSuccess('');
    setShowOrderModal(true);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setSendingOrder(true);
    try {
      // Simulate API email/procurement trigger
      await new Promise(r => setTimeout(r, 1200));
      
      // Update inventory on backend to simulate receiving stock
      const newStock = selectedSug.stock + parseInt(orderQty);
      await axios.put(`/inventory/${selectedSug.medicine_id}`, {
        current_stock: newStock
      });

      setOrderSuccess("Purchase order successfully sent to supplier! Stock updated.");
      setTimeout(() => {
        setShowOrderModal(false);
        fetchAlerts(); // Refresh alerts
      }, 1500);
    } catch (err) {
      alert("Failed to submit purchase order.");
    } finally {
      setSendingOrder(false);
    }
  };

  if (loading || !alerts) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <span className="ml-3 font-bold text-slate-500">Scanning inventory health parameters...</span>
      </div>
    );
  }

  const activeSupplierMap = {};
  suppliers.forEach(s => {
    activeSupplierMap[s.supplier_id] = s.supplier_name;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight dark:text-white">Alert Center</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold font-sans">Monitor inventory risks, stock shortages, expiry warnings, and overstocks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Shortages & Expiries */}
        <div className="space-y-6">
          {/* Critical and Low Stock Block */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-extrabold dark:text-white uppercase tracking-wider text-danger flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-danger"></span>
              <span>Low & Critical Stock ({alerts.counts.low_stock + alerts.counts.critical_stock})</span>
            </h3>
            
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {alerts.critical_stock.map(item => (
                <div key={item.medicine_id} className="p-3.5 rounded-xl border border-red-500/15 bg-red-500/5 text-xs">
                  <div className="flex justify-between font-bold dark:text-white">
                    <span>{item.name}</span>
                    <span className="text-danger uppercase text-[9px] tracking-wider bg-red-500/10 px-2 py-0.5 rounded">CRITICAL</span>
                  </div>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold mt-1">
                    Stock: <span className="font-extrabold text-danger">{item.stock}</span> (Reorder Trigger: {item.reorder_level} units)
                  </p>
                </div>
              ))}
              
              {alerts.low_stock.map(item => (
                <div key={item.medicine_id} className="p-3.5 rounded-xl border border-red-500/10 bg-red-500/5 text-xs">
                  <div className="flex justify-between font-bold dark:text-white">
                    <span>{item.name}</span>
                    <span className="text-danger uppercase text-[9px] tracking-wider bg-red-500/5 px-2 py-0.5 rounded">LOW</span>
                  </div>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold mt-1">
                    Stock: <span className="font-extrabold text-danger">{item.stock}</span> (Reorder Trigger: {item.reorder_level} units)
                  </p>
                </div>
              ))}

              {alerts.critical_stock.length === 0 && alerts.low_stock.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">All medicine stocks are currently within healthy parameters.</div>
              )}
            </div>
          </div>

          {/* Near Expiry Block */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-extrabold dark:text-white uppercase tracking-wider text-warning flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse"></span>
              <span>Near Expiry Alerts ({alerts.counts.near_expiry})</span>
            </h3>
            
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {alerts.near_expiry.map(item => (
                <div key={item.medicine_id} className="p-3.5 rounded-xl border border-orange-500/15 bg-orange-500/5 text-xs">
                  <div className="flex justify-between font-bold dark:text-white">
                    <span>{item.name}</span>
                    <span className="text-warning uppercase text-[9px] tracking-wider bg-warning/15 px-2 py-0.5 rounded">
                      {item.days_remaining} Days Left
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold mt-1">
                    Expiry Date: <span className="font-bold">{item.expiry_date}</span>
                  </p>
                </div>
              ))}

              {alerts.near_expiry.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">No batch is expiring within the next 30 days.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Suggestions & Overstocks */}
        <div className="space-y-6">
          {/* Procurement Reorder Suggestions */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-extrabold dark:text-white uppercase tracking-wider text-primary flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
              <span>Procurement Suggestions ({alerts.counts.reorder_suggestions})</span>
            </h3>
            
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {alerts.reorder_suggestions.map(sug => (
                <div 
                  key={sug.medicine_id} 
                  className="p-3.5 rounded-xl border border-primary/15 bg-primary/5 text-xs flex justify-between items-center"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold dark:text-white">{sug.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Supplier: {activeSupplierMap[sug.supplier_id] || "Unknown"}</p>
                    <p className="text-[10px] text-slate-550 dark:text-slate-450 font-semibold">
                      Predict Demand: {sug.predicted_demand_30d} units | Stock: {sug.stock}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end space-y-2">
                    <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded">Order {sug.recommended_reorder}</span>
                    <button
                      onClick={() => handleReorderClick(sug)}
                      className="px-2.5 py-1 rounded bg-primary text-white font-extrabold text-[9px] tracking-wide shadow-md shadow-primary/10 cursor-pointer"
                    >
                      Process Order
                    </button>
                  </div>
                </div>
              ))}

              {alerts.reorder_suggestions.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">No reorder requests recommended by the AI forecaster.</div>
              )}
            </div>
          </div>

          {/* Overstock Alerts */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-extrabold dark:text-white uppercase tracking-wider text-yellow-500 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              <span>Overstock Warnings ({alerts.counts.overstock})</span>
            </h3>
            
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {alerts.overstock.map(item => (
                <div key={item.medicine_id} className="p-3.5 rounded-xl border border-yellow-500/15 bg-yellow-500/5 text-xs">
                  <div className="flex justify-between font-bold dark:text-white">
                    <span>{item.name}</span>
                    <span className="text-yellow-650 uppercase text-[9px] tracking-wider bg-yellow-500/10 px-2 py-0.5 rounded">OVERSTOCK</span>
                  </div>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold mt-1">
                    Current stock level ({item.stock}) is double the predicted 30-day sales demand ({item.predicted_demand_30d} units).
                  </p>
                </div>
              ))}

              {alerts.overstock.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">No overstocked medicine batches detected in inventory.</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Procurement Suggestion Purchase Order Modal */}
      {showOrderModal && selectedSug && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md glass-card border border-white/10 dark:text-white rounded-3xl p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-200/50 dark:border-slate-800/50 mb-4">
              <div className="p-2 bg-primary/10 text-primary rounded-xl"><Package size={18} /></div>
              <h3 className="text-base font-extrabold">Generate Supplier Purchase Order</h3>
            </div>

            {orderSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-success flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <p className="text-xs font-bold text-success">{orderSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} className="space-y-4">
                <div className="text-xs space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 font-semibold">
                  <div><span className="text-slate-400">Medicine:</span> <span className="dark:text-white">{selectedSug.name}</span></div>
                  <div><span className="text-slate-400">Supplier:</span> <span className="dark:text-white">{activeSupplierMap[selectedSug.supplier_id] || "Unknown"}</span></div>
                  <div><span className="text-slate-400">Suggested Order:</span> <span className="dark:text-white">{selectedSug.recommended_reorder} units</span></div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Procurement Quantity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={orderQty}
                    onChange={(e) => setOrderQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200/40 dark:border-slate-800/30">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 text-slate-800 text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingOrder}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all"
                  >
                    {sendingOrder ? "Sending PO..." : "Confirm & Send"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertCenter;
