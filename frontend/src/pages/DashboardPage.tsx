import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, LogOut, AlertCircle, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch, ApiError } from '../lib/api';
import type { Inquiry, InquiryStatus, Priority } from '../types';

const STATUS_BADGE: Record<InquiryStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  RESOLVED: 'bg-emerald-100 text-emerald-800',
};

const PRIORITY_BADGE: Record<Priority, string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-orange-100 text-orange-800',
  HIGH: 'bg-red-100 text-red-800',
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchInquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);

      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiFetch<{ inquiries: Inquiry[] }>(`/api/inquiries${query}`);
      setInquiries(data.inquiries);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchInquiries, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, priorityFilter]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Customer Inquiries</h1>
            <p className="text-xs text-slate-500">
              Signed in as <span className="font-medium text-slate-700">{user?.name}</span> ({user?.role})
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/inquiries/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              New Inquiry
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, contact, or subject..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Error State */}
        {error && (
          <div role="alert" className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
            <button onClick={fetchInquiries} className="text-xs font-medium text-red-800 underline cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse p-4" />
            ))}
          </div>
        ) : inquiries.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-semibold text-slate-800">No inquiries found</h2>
            <p className="text-sm text-slate-500 mt-1">
              {search || statusFilter || priorityFilter
                ? 'Try clearing your search or filters.'
                : 'Record your first customer inquiry to get started.'}
            </p>
          </div>
        ) : (
          /* Inquiry List */
          <div className="space-y-3">
            {inquiries.map((inq) => (
              <Link
                key={inq.id}
                to={`/inquiries/${inq.id}`}
                className="block bg-white hover:border-amber-400 transition rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{inq.subject}</h3>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {inq.customerName} &middot; <span className="text-slate-500">{inq.customerContact}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PRIORITY_BADGE[inq.priority]}`}>
                      {inq.priority}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[inq.status]}`}>
                      {inq.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>Recorded by {inq.createdBy?.name || 'Staff'}</span>
                  <span>{new Date(inq.createdAt).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}