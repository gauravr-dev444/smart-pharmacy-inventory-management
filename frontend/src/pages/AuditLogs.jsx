import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, RefreshCw } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/audit_logs');
      setLogs(res.data);
    } catch (err) {
      console.error("Error loading audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <span className="ml-3 font-bold text-slate-500">Retrieving secure system audit trails...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight dark:text-white">Security Audit Trail</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold font-sans">View system transactions, inventory modifications, ML retraining, and administrative logs</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold dark:text-white"
        >
          <RefreshCw size={14} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 border-b border-slate-200/50 dark:border-slate-800/50">
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wide">Timestamp</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wide">Action</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wide">User Account</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wide">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/30">
              {logs.map(log => (
                <tr key={log.log_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{log.timestamp.replace('T', ' ').substring(0, 19)}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-danger text-[9px] font-extrabold uppercase tracking-wider">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 font-bold dark:text-white">{log.user}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 font-medium max-w-sm whitespace-normal break-words">
                    {log.details}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">
                    No system audit logs found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
