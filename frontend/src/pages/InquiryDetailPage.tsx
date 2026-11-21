import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiFetch, ApiError } from '../lib/api';
import type { Inquiry, InquiryStatus } from '../types';

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [updating, setUpdating] = useState(false);
  const [staleWarning, setStaleWarning] = useState('');
  const [actionError, setActionError] = useState('');

  const loadInquiry = async () => {
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage('');
    setStaleWarning('');
    setActionError('');
    try {
      const data = await apiFetch<{ inquiry: Inquiry }>(`/api/inquiries/${id}`);
      setInquiry(data.inquiry);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorStatus(err.status);
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Unable to load inquiry');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiry();
  }, [id]);

  const updateStatus = async (nextStatus: InquiryStatus) => {
    if (!inquiry) return;
    setUpdating(true);
    setActionError('');
    setStaleWarning('');

    try {
      const data = await apiFetch<{ inquiry: Inquiry }>(`/api/inquiries/${inquiry.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, version: inquiry.version }),
      });
      setInquiry(data.inquiry);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setStaleWarning(err.message);
      } else if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError('Failed to update status');
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-2xl mx-auto h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (errorStatus === 403 || errorStatus === 404 || errorStatus === 400 || !inquiry) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-slate-900">
            {errorStatus === 403 ? 'Access Denied' : 'Inquiry Unavailable'}
          </h1>
          <p className="text-sm text-slate-600 mt-2">{errorMessage || 'Could not find this inquiry.'}</p>
          <Link
            to="/"
            className="inline-block mt-6 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Inquiries
        </Link>

        {/* Stale Data Conflict Banner */}
        {staleWarning && (
          <div role="alert" className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-4">
            <div className="flex items-start gap-2.5 text-sm text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <span>{staleWarning}</span>
            </div>
            <button
              onClick={loadInquiry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        )}

        {actionError && (
          <div role="alert" className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{inquiry.subject}</h1>
              <p className="text-sm text-slate-500 mt-1">
                Priority: <span className="font-medium text-slate-700">{inquiry.priority}</span> &middot; Version v{inquiry.version}
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-800">
              {inquiry.status.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-100 text-sm">
            <div>
              <span className="text-slate-400 block text-xs">Customer Name</span>
              <span className="font-medium text-slate-800">{inquiry.customerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Contact</span>
              <span className="font-medium text-slate-800">{inquiry.customerContact}</span>
            </div>
          </div>

          <div className="py-4 border-b border-slate-100">
            <span className="text-slate-400 block text-xs mb-1">Description</span>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{inquiry.description}</p>
          </div>

          {/* Status Lifecycle Controls */}
          <div className="pt-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Workflow Status</h2>

            {inquiry.status === 'NEW' && (
              <button
                disabled={updating}
                onClick={() => updateStatus('IN_PROGRESS')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg cursor-pointer"
              >
                {updating ? 'Updating...' : 'Start Working (Move to In Progress)'}
              </button>
            )}

            {inquiry.status === 'IN_PROGRESS' && (
              <button
                disabled={updating}
                onClick={() => updateStatus('RESOLVED')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg cursor-pointer"
              >
                {updating ? 'Updating...' : 'Mark as Resolved'}
              </button>
            )}

            {inquiry.status === 'RESOLVED' && (
              <div className="inline-flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                This inquiry is resolved (final state).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}