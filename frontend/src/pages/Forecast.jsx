import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  BrainCircuit, Cpu, CheckCircle2, TrendingUp 
} from 'lucide-react';

const Forecast = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [selectedMedId, setSelectedMedId] = useState('');
  
  // Forecast states
  const [forecast, setForecast] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Model training status
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState(null);
  const [training, setTraining] = useState(false);
  const [trainMessage, setTrainMessage] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchMedicines();
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (selectedMedId) {
      fetchForecast(selectedMedId);
    }
  }, [selectedMedId]);

  const fetchMedicines = async () => {
    try {
      const res = await axios.get('/inventory');
      setMedicines(res.data);
      if (res.data.length > 0) {
        setSelectedMedId(res.data[0].medicine_id);
      }
    } catch (err) {
      console.error("Error fetching medicines", err);
    }
  };

  const fetchForecast = async (medId) => {
    setLoadingForecast(true);
    try {
      const res = await axios.get(`/forecast/${medId}`);
      setForecast(res.data);
    } catch (err) {
      console.error("Error fetching forecast details", err);
    } finally {
      setLoadingForecast(false);
    }
  };

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    setMetricsError(null);
    try {
      const res = await axios.get('/forecast/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error("Error fetching model metrics", err);
      setMetricsError(err.response?.data?.detail || err.message || "Failed to load model metrics");
    } finally {
      setLoadingMetrics(false);
    }
  };

  const triggerRetraining = async () => {
    setTraining(true);
    setTrainMessage('');
    try {
      const res = await axios.post('/forecast/train');
      setTrainMessage(res.data.message);
      // Poll metrics in 5 seconds
      setTimeout(fetchMetrics, 5000);
    } catch (err) {
      setTrainMessage("Error starting training: " + (err.response?.data?.detail || err.message));
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight dark:text-white">AI Forecasting Engine</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Predict future consumer demand, optimize safety stock levels, and automate procurement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Forecast Display Area */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-primary/10 text-primary rounded-xl"><BrainCircuit size={20} /></div>
              <h3 className="text-base font-extrabold dark:text-white">AI Demand Predictions</h3>
            </div>
            
            {/* Medicine Selection dropdown */}
            <select
              value={selectedMedId}
              onChange={(e) => setSelectedMedId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-700/50 text-xs font-bold dark:text-white outline-none"
            >
              {medicines.map(med => (
                <option key={med.medicine_id} value={med.medicine_id}>{med.name}</option>
              ))}
            </select>
          </div>

          {loadingForecast ? (
            <div className="flex h-64 items-center justify-center">
              <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <span className="ml-3 text-xs text-slate-500 font-bold">Computing forecast vectors...</span>
            </div>
          ) : forecast ? (
            <div className="space-y-6">
              {/* Forecast calculations KPIs */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/40">
                  <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">30-Day Predicted Demand</p>
                  <h4 className="text-xl font-black mt-1 dark:text-white">{forecast.predicted_demand} units</h4>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/40">
                  <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Safety Stock (20%)</p>
                  <h4 className="text-xl font-black mt-1 dark:text-white">{forecast.safety_stock} units</h4>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/40">
                  <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Recommended Reorder</p>
                  <h4 className="text-xl font-black mt-1 text-primary dark:text-primary-light">
                    {forecast.recommended_reorder > 0 ? `${forecast.recommended_reorder} units` : "0 (Adequate)"}
                  </h4>
                </div>
              </div>

              {/* Confidence Indicator */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Model Forecast Confidence Score</h5>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Calculated using R² validation on test data slice</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                    {(forecast.confidence_score * 100).toFixed(1)}% Confidence
                  </span>
                </div>
              </div>

              {/* Forecast graph chart */}
              <div className="space-y-2">
                <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">30-Day Daily Sales Forecast Graph</h5>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast.forecast_series} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFrc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={9} fontWeight="bold" />
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
                      <Area type="monotone" dataKey="demand" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorFrc)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">Select a medicine to view AI demand forecast.</div>
          )}
        </div>

        {/* Model evaluation / training panel */}
        <div className="space-y-6">
          
          {/* Models comparison list */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
              <div className="p-2 bg-secondary/10 text-secondary rounded-xl"><Cpu size={16} /></div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider dark:text-white">ML Models Comparison</h3>
            </div>
            
            {loadingMetrics ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
                <span className="ml-2.5 text-xs text-slate-400 font-bold">Loading model evaluation metrics...</span>
              </div>
            ) : metricsError ? (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold text-center">
                {metricsError}
                <button onClick={fetchMetrics} className="block mx-auto mt-2 text-[10px] text-primary underline font-extrabold cursor-pointer">Retry</button>
              </div>
            ) : metrics?.all_models && Object.keys(metrics.all_models).length > 0 ? (
              <div className="space-y-3">
                {Object.keys(metrics.all_models).map(name => {
                  const m = metrics.all_models[name];
                  const isBest = metrics.best_model === name;
                  return (
                    <div 
                      key={name} 
                      className={`p-3 rounded-xl border transition-all ${
                        isBest 
                          ? 'bg-secondary/5 border-secondary/35 shadow-sm' 
                          : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold dark:text-white">{name}</span>
                        {isBest && <span className="text-[8px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-black uppercase">BEST</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-1 mt-2 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        <div>RMSE: <span className="dark:text-slate-300 font-extrabold">{typeof m.RMSE === 'number' ? m.RMSE.toFixed(1) : m.RMSE}</span></div>
                        <div>MAE: <span className="dark:text-slate-300 font-extrabold">{typeof m.MAE === 'number' ? m.MAE.toFixed(1) : m.MAE}</span></div>
                        <div>R²: <span className="dark:text-slate-300 font-extrabold">{typeof m.R2 === 'number' ? m.R2.toFixed(3) : m.R2}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : metrics?.metrics ? (
              <div className="p-3 rounded-xl border bg-secondary/5 border-secondary/35">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold dark:text-white">{metrics.best_model || 'Model'}</span>
                  <span className="text-[8px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-black uppercase">DEPLOYED</span>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-2 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                  <div>RMSE: <span className="dark:text-slate-300 font-extrabold">{metrics.metrics.RMSE?.toFixed(1) || '0.0'}</span></div>
                  <div>MAE: <span className="dark:text-slate-300 font-extrabold">{metrics.metrics.MAE?.toFixed(1) || '0.0'}</span></div>
                  <div>R²: <span className="dark:text-slate-300 font-extrabold">{metrics.metrics.R2?.toFixed(3) || '0.000'}</span></div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">No model evaluation metrics available yet.</div>
            )}
          </div>

          {/* Model Retraining block */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
              <div className="p-2 bg-success/10 text-success rounded-xl"><TrendingUp size={16} /></div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider dark:text-white">Forecaster Controls</h3>
            </div>

            <p className="text-[10px] text-slate-400 font-medium">
              Train linear, forest, and gradient boosting algorithms on current datasets. The best-performing model is deployed dynamically.
            </p>

            {trainMessage && (
              <div className="p-3 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-xl flex items-center space-x-2">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{trainMessage}</span>
              </div>
            )}

            {isAdmin ? (
              <button
                onClick={triggerRetraining}
                disabled={training}
                className="w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-extrabold text-xs shadow-md shadow-secondary/25 transition-all cursor-pointer"
              >
                {training ? "Running Pipeline..." : "Retrain ML Engine"}
              </button>
            ) : (
              <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                Admin Privilege Required
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Forecast;
