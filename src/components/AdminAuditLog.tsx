import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { fetchAuditLogs } from '../firebaseUtils';
import { motion } from 'motion/react';
import { 
  ClipboardList, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  Calendar, 
  User, 
  FileText, 
  Stethoscope, 
  SlidersHorizontal,
  ChevronRight,
  Info
} from 'lucide-react';

interface AdminAuditLogProps {
  currentAdminEmail: string;
}

export default function AdminAuditLog({ currentAdminEmail }: AdminAuditLogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      setError(null);
      try {
        const auditLogs = await fetchAuditLogs();
        setLogs(auditLogs);
        setFilteredLogs(auditLogs);
      } catch (err: any) {
        console.error('Error fetching audit logs:', err);
        setError('Failed to load system audit logs.');
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [refreshCount]);

  useEffect(() => {
    let result = logs;

    // Apply Search
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.adminName.toLowerCase().includes(term) ||
        log.adminEmail.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term) ||
        log.targetName.toLowerCase().includes(term)
      );
    }

    // Apply action type filter
    if (actionFilter !== 'all') {
      result = result.filter(log => log.action === actionFilter);
    }

    setFilteredLogs(result);
  }, [searchTerm, actionFilter, logs]);

  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  // Get distinct main classes of action types for the filter dropdown
  const actionTypes = Array.from(new Set(logs.map(l => l.action)));

  // Helper to choose badge color based on action type
  const getActionBadgeStyle = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('add')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (act.includes('delete') || act.includes('remove')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (act.includes('update') || act.includes('modify') || act.includes('edit')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (act.includes('confirm') || act.includes('approve')) {
      return 'bg-violet-50 text-violet-700 border-violet-200';
    }
    if (act.includes('cancel')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('doctor')) {
      return <Stethoscope className="h-4 w-4 text-emerald-600" />;
    }
    if (act.includes('appointment')) {
      return <Calendar className="h-4 w-4 text-teal-600" />;
    }
    if (act.includes('report')) {
      return <FileText className="h-4 w-4 text-indigo-600" />;
    }
    return <ClipboardList className="h-4 w-4 text-slate-600" />;
  };

  const formatTimestamp = (timestampString: string) => {
    try {
      const date = new Date(timestampString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timestampString;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden" id="audit-log-workspace">
      {/* Search & Filter Header bar */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50" id="audit-log-controls">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-sans tracking-tight">System Audit logs</h2>
              <p className="text-xs text-slate-500">Track and view administrator administrative mutations on database records.</p>
            </div>
          </div>
          
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            id="audit-log-refresh-btn"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {/* Search Inputs */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by action, details, admin, or change target..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg shadow-sm"
              id="audit-log-search-input"
            />
          </div>

          {/* Action Filter */}
          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg shadow-sm appearance-none cursor-pointer"
              id="audit-log-filter-select"
            >
              <option value="all">🛡️ All Actions</option>
              {actionTypes.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20" id="audit-log-loading">
          <RefreshCw className="h-8 w-8 text-teal-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Retrieving system operation logs...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center" id="audit-log-error">
          <div className="inline-flex p-3 bg-rose-50 text-rose-600 rounded-full mb-3">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-3 px-4 py-1.5 text-xs text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white" id="audit-log-empty">
          <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No logs found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || actionFilter !== 'all' 
              ? "We couldn't find any audit logs matching your current filters." 
              : "No system changes have been logged yet by our administrative team."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto" id="audit-log-table-container">
          <table className="w-full text-left border-collapse" id="audit-log-records-table">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold tracking-wider uppercase border-b border-slate-100">
                <th className="py-3 px-4">Action & Log ID</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Modifications & Impacted Entity</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLogs.map((log) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="hover:bg-slate-50/50 transition-colors"
                  id={`audit-row-${log.id}`}
                >
                  {/* Action Column */}
                  <td className="py-3 px-4 align-top">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${getActionBadgeStyle(log.action)}`}>
                      {getActionIcon(log.action)}
                      {log.action}
                    </span>
                    <div className="font-mono text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                      <span>Log Ref:</span>
                      <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-medium">{log.id}</span>
                    </div>
                  </td>

                  {/* Admin User Column */}
                  <td className="py-3 px-4 align-top">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs flex items-center justify-center">
                        {log.adminName.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-xs">{log.adminName}</div>
                        <div className="text-[10px] text-slate-400 font-mono select-all leading-none">{log.adminEmail}</div>
                        {log.adminEmail === currentAdminEmail && (
                          <span className="inline-block mt-0.5 text-[8px] bg-teal-50 text-teal-700 font-bold tracking-wide rounded px-1 uppercase">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Action Description Column */}
                  <td className="py-3 px-4 align-top">
                    <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100/50 leading-relaxed font-sans max-w-md">
                      {log.details}
                    </p>
                    <div className="mt-2 text-[11px] flex items-center space-x-1">
                      <span className="text-slate-400">Target Entity:</span>
                      <span className="font-semibold text-slate-700 bg-teal-50/50 px-1.5 py-0.5 rounded border border-teal-100/30 font-sans">
                        {log.targetName}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-400 font-mono text-[9px]">ID: {log.targetId}</span>
                    </div>
                  </td>

                  {/* Timestamp Column */}
                  <td className="py-3 px-4 text-right align-top text-slate-500">
                    <div className="text-xs font-medium text-slate-800">{formatTimestamp(log.timestamp)}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">UTC Timezone</div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Alert Banner */}
      <div className="p-4 border-t border-slate-100 bg-teal-50/10 flex items-start space-x-2.5 text-xs text-slate-500" id="audit-log-footer-note">
        <Info className="h-4 w-4 text-teal-600/80 flex-shrink-0 mt-0.5" />
        <p>
          This immutable audit trail conforms to administrative guidelines. For compliance verification, log entries are timestamped automatically by secure Google Cloud servers when they are deployed online.
        </p>
      </div>
    </div>
  );
}
