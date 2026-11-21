import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  LogOut,
  AlertCircle,
  Inbox,
  Coffee,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch, ApiError } from '../lib/api';
import type { Inquiry, InquiryStatus, Priority } from '../types';

const STATUS_META: Record<InquiryStatus, { label: string; dot: string; pill: string }> = {
  NEW: {
    label: 'New',
    dot: 'bg-sky-500',
    pill: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/80',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dot: 'bg-amber-500',
    pill: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200/80',
  },
  RESOLVED: {
    label: 'Resolved',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/80',
  },
};

const PRIORITY_STYLE: Record<Priority, string> = {
  LOW: 'text-stone-500 bg-stone-100',
  MEDIUM: 'text-orange-700 bg-orange-50 ring-1 ring-inset ring-orange-200/60',
  HIGH: 'text-red-700 bg-red-50 ring-1 ring-inset ring-red-200/60',
};

function getInitials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const hasActiveFilters = Boolean(search.trim() || statusFilter || priorityFilter);

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

  const counts = {
    total: inquiries.length,
    newCount: inquiries.filter((i) => i.status === 'NEW').length,
    inProgress: inquiries.filter((i) => i.status === 'IN_PROGRESS').length,
    resolved: inquiries.filter((i) => i.status === 'RESOLVED').length,
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-stone-900 leading-none">
                Inquiry Desk
              </h1>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {user?.role === 'ADMIN' ? 'All Team Inquiries' : 'My Assigned Inquiries'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 pr-3 border-r border-stone-200">
              <div className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold flex items-center justify-center">
                {getInitials(user?.name)}
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-stone-800 leading-none">{user?.name}</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400 mt-0.5">
                  {user?.role}
                </p>
              </div>
            </div>

            <Link
              to="/inquiries/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              New Inquiry
            </Link>

            <button
              onClick={logout}
              title="Sign out"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Compact Operational Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Showing', value: counts.total, accent: 'text-stone-900' },
            { label: 'New', value: counts.newCount, accent: 'text-sky-700' },
            { label: 'In Progress', value: counts.inProgress, accent: 'text-amber-700' },
            { label: 'Resolved', value: counts.resolved, accent: 'text-emerald-700' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-stone-200/80 px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
                {stat.label}
              </p>
              <p className={`text-2xl font-semibold tabular-nums mt-0.5 ${stat.accent}`}>
                {loading ? '–' : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-3 rounded-xl border border-stone-200/80 mb-5 flex flex-col sm:flex-row gap-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, contact, or subject..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50/70 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none focus:border-stone-900 cursor-pointer"
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
              className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none focus:border-stone-900 cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div
            role="alert"
            className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchInquiries}
              className="text-xs font-semibold text-red-800 hover:underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl border border-stone-200/80 divide-y divide-stone-100 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 animate-pulse flex items-center justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  <div className="h-4 bg-stone-200/80 rounded w-1/3" />
                  <div className="h-3 bg-stone-100 rounded w-1/2" />
                </div>
                <div className="h-6 bg-stone-100 rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : inquiries.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-stone-200/80 p-14 text-center">
            <div className="w-11 h-11 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-stone-900">No inquiries found</h2>
            <p className="text-sm text-stone-500 mt-1 max-w-xs mx-auto">
              {hasActiveFilters
                ? 'No records match your current search or filter criteria.'
                : 'Record your first customer inquiry to start tracking requests.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="mt-4 px-3.5 py-2 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg transition cursor-pointer"
              >
                Reset filters
              </button>
            ) : (
              <Link
                to="/inquiries/new"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Record Inquiry
              </Link>
            )}
          </div>
        ) : (
          /* Scannable Inquiry List */
          <div className="bg-white rounded-2xl border border-stone-200/80 divide-y divide-stone-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            {inquiries.map((inq) => {
              const status = STATUS_META[inq.status];
              return (
                <Link
                  key={inq.id}
                  to={`/inquiries/${inq.id}`}
                  className="group flex items-center justify-between gap-4 px-5 py-4 hover:bg-stone-50/80 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${status.dot}`} />
                      <h3 className="text-sm font-semibold text-stone-900 group-hover:text-amber-800 truncate transition">
                        {inq.subject}
                      </h3>
                    </div>

                    <div className="mt-1.5 pl-4.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
                      <span className="font-medium text-stone-700">{inq.customerName}</span>
                      <span className="text-stone-300">&bull;</span>
                      <span>{inq.customerContact}</span>
                      <span className="text-stone-300 hidden sm:inline">&bull;</span>
                      <span className="hidden sm:inline text-stone-400">
                        {inq.createdBy?.name || 'Staff'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`hidden sm:inline-flex text-[11px] font-medium px-2 py-0.5 rounded-md ${PRIORITY_STYLE[inq.priority]}`}
                    >
                      {inq.priority}
                    </span>
                    <span
                      className={`inline-flex text-[11px] font-medium px-2.5 py-0.5 rounded-full ${status.pill}`}
                    >
                      {status.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-600 group-hover:translate-x-0.5 transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}