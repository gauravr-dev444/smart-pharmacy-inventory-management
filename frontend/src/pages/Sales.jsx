import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  FileText, TrendingUp, DollarSign, ShoppingCart, AlertCircle 
} from 'lucide-react';

const Sales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // POS Form state
  const [selectedMedId, setSelectedMedId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [saleError, setSaleError] = useState('');
  const [saleSuccess, setSaleSuccess] = useState('');
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchMedicines();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/sales');
      setSales(res.data);
    } catch (err) {
      console.error("Error fetching sales logs", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await axios.get('/inventory');
      setMedicines(res.data);
      if (res.data.length > 0) {
        setSelectedMedId(res.data[0].medicine_id);
      }
    } catch (err) {
      console.error("Error fetching inventory list", err);
    }
  };

  const selectedMed = medicines.find(m => m.medicine_id === selectedMedId);
  const unitPrice = selectedMed ? selectedMed.price : 0;
  const availableStock = selectedMed ? selectedMed.available_stock : 0;
  const totalPrice = unitPrice * quantity;

  const handleRecordSale = async (e) => {
    e.preventDefault();
    setSaleError('');
    setSaleSuccess('');
    setRecording(true);

    if (quantity <= 0) {
      setSaleError("Quantity must be greater than zero.");
      setRecording(false);
      return;
    }

    if (quantity > availableStock) {
      setSaleError(`Insufficient stock. Available: ${availableStock} units.`);
      setRecording(false);
      return;
    }

    try {
      const response = await axios.post('/sales', {
        medicine_id: selectedMedId,
        quantity: parseInt(quantity)
      });
      
      setSaleSuccess(`Recorded sale! Total Revenue: ₹${response.data.revenue.toFixed(2)}`);
      setQuantity(1);
      
      // Refresh database records
      await Promise.all([fetchSales(), fetchMedicines()]);
    } catch (err) {
      setSaleError(err.response?.data?.detail || "Failed to record transaction.");
    } finally {
      setRecording(false);
    }
  };

  // KPI Calculations
  const todayStr = new Date().toISOString().substring(0, 10);
  const todaySales = sales.filter(s => s.sale_date.startsWith(todayStr));
  const dailyTransactions = todaySales.length;
  const dailyRevenue = todaySales.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalRevenue = sales.reduce((acc, curr) => acc + curr.revenue, 0);

  // Daily Sales Chart aggregator
  const dailyTrends = {};
  sales.slice(0, 50).forEach(s => {
    const day = s.sale_date.substring(5, 10); // MM-DD format
    dailyTrends[day] = (dailyTrends[day] || 0) + s.revenue;
  });
  const chartData = Object.keys(dailyTrends)
    .sort()
    .map(day => ({
      Day: day,
      Revenue: parseFloat(dailyTrends[day].toFixed(2))
    }));

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <span className="ml-3 font-bold text-slate-500">Loading Sales Records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight dark:text-white">Sales & POS</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Process client purchases, issue receipts, and track daily revenue flows</p>
      </div>

      {/* Grid Panel: POS and KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Record Sales Card */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 space-y-6">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="p-2 bg-primary/10 text-primary rounded-xl"><ShoppingCart size={20} /></div>
            <h3 className="text-base font-extrabold dark:text-white">New Sales Transaction (POS)</h3>
          </div>

          {saleError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-danger text-xs font-bold rounded-xl flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{saleError}</span>
            </div>
          )}

          {saleSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-success text-xs font-bold rounded-xl flex items-center space-x-2">
              <span>{saleSuccess}</span>
            </div>
          )}

          <form onSubmit={handleRecordSale} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Select Medicine</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => { setSelectedMedId(e.target.value); setSaleError(''); setSaleSuccess(''); }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-700/50 text-xs font-bold dark:text-white outline-none"
                >
                  {medicines.map(med => (
                    <option key={med.medicine_id} value={med.medicine_id}>
                      {med.name} (Batch: {med.batch_no} - Stock: {med.available_stock})
                    </option>
                  ))}
                  {medicines.length === 0 && <option value="">No inventory found</option>}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Sales Quantity</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quantity}
                  onChange={(e) => { setQuantity(e.target.value); setSaleError(''); setSaleSuccess(''); }}
                  placeholder="1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Calculations Box */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Unit Retail Price:</span>
                  <span className="font-bold dark:text-white">₹{unitPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Available Stock:</span>
                  <span className={`font-bold ${availableStock < 50 ? 'text-danger' : 'dark:text-white'}`}>{availableStock} units</span>
                </div>
                <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-2 flex justify-between text-sm">
                  <span className="text-slate-400 font-extrabold">Total Amount:</span>
                  <span className="font-black text-primary text-base">₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={recording || medicines.length === 0}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-extrabold text-xs tracking-wide shadow-md shadow-primary/20 transition-all"
              >
                {recording ? "Recording..." : "Record Transaction"}
              </button>
            </div>
          </form>
        </div>

        {/* Sales Stats Box */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Daily Transactions</p>
              <h3 className="text-2xl font-black mt-1 dark:text-white">{dailyTransactions} sales</h3>
              <p className="text-[10px] text-slate-400 mt-1">Processed today</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <FileText size={24} />
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Daily Revenue</p>
              <h3 className="text-2xl font-black mt-1 dark:text-white">₹{dailyRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
              <p className="text-[10px] text-success mt-1">Generated today</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* Sales Logs & Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Transactions Table */}
        <div className="glass-card rounded-2xl overflow-hidden shadow-sm lg:col-span-2">
          <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <h3 className="text-base font-extrabold dark:text-white">Transaction Logs (Last 20)</h3>
          </div>
          <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 border-b border-slate-200/50 dark:border-slate-800/50">
                  <th className="p-3.5 text-[9px] font-extrabold uppercase tracking-wide">ID</th>
                  <th className="p-3.5 text-[9px] font-extrabold uppercase tracking-wide">Medicine</th>
                  <th className="p-3.5 text-[9px] font-extrabold uppercase tracking-wide">Category</th>
                  <th className="p-3.5 text-[9px] font-extrabold uppercase tracking-wide text-center">Qty</th>
                  <th className="p-3.5 text-[9px] font-extrabold uppercase tracking-wide">Revenue</th>
                  <th className="p-3.5 text-[9px] font-extrabold uppercase tracking-wide">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/30">
                {sales.slice(0, 20).map(sale => (
                  <tr key={sale.sale_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <td className="p-3.5 font-mono text-[10px] text-slate-400">{sale.sale_id}</td>
                    <td className="p-3.5 font-bold dark:text-white">{sale.medicine_name}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">{sale.category}</span>
                    </td>
                    <td className="p-3.5 text-center font-bold">{sale.quantity}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">₹{sale.revenue.toFixed(2)}</td>
                    <td className="p-3.5 text-slate-550 dark:text-slate-400 font-mono text-[10px]">{sale.sale_date}</td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      No sales recorded in the system database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Sales Bar Chart */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-extrabold mb-4 dark:text-white">Recent Daily Sales (₹)</h4>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="Day" stroke="#94A3B8" fontSize={9} fontWeight="bold" />
                    <YAxis stroke="#94A3B8" fontSize={9} fontWeight="bold" />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(30, 41, 59, 0.9)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#FFF',
                        fontSize: '11px'
                      }} 
                    />
                    <Bar dataKey="Revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">No chart data.</div>
              )}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200/40 dark:border-slate-700/40 text-center text-[10px] text-slate-400 font-semibold">
            Cumulative Revenue: ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Sales;
