import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  User as UserIcon,
  Mail,
  Clock,
  Play,
  Check,
} from 'lucide-react';
import { apiFetch, ApiError } from '../lib/api';
import type { Inquiry, InquiryStatus } from '../types';

const STEPS: { key: InquiryStatus; label: string }[] = [
  { key: 'NEW', label: 'New' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
];

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
      <div className="min-h-screen bg-[#F8F7F4] py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto h-72 bg-white rounded-2xl border border-stone-200/80 animate-pulse" />
      </div>
    );
  }

  if (errorStatus === 403 || errorStatus === 404 || errorStatus === 400 || !inquiry) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] py-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-stone-200/80 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-base font-semibold text-stone-900">
            {errorStatus === 403 ? 'Access Denied' : 'Inquiry Unavailable'}
          </h1>
          <p className="text-sm text-stone-500 mt-1.5">
            {errorMessage || 'Could not find this inquiry.'}
          </p>
          <Link
            to="/"
            className="inline-block mt-6 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition"
          >
            Back to Inquiry Desk
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIdx = STEPS.findIndex((s) => s.key === inquiry.status);

  return (
    <div className="min-h-screen bg-[#F8F7F4] py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 mb-5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Inquiry Desk
        </Link>

        {/* Stale Data Conflict Banner */}
        {staleWarning && (
          <div
            role="alert"
            className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start gap-2.5 text-sm text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{staleWarning}</span>
            </div>
            <button
              onClick={loadInquiry}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg shrink-0 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Latest
            </button>
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
          >
            {actionError}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 py-6 border-b border-stone-100">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                    {inquiry.priority} PRIORITY
                  </span>
                  <span className="text-[11px] font-mono text-stone-400">v{inquiry.version}</span>
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-stone-900">
                  {inquiry.subject}
                </h1>
              </div>
            </div>

            {/* Visual 3-Step Lifecycle Stepper */}
            <div className="mt-6 flex items-center gap-2">
              {STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIdx || inquiry.status === 'RESOLVED';
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center transition ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                              ? 'bg-stone-900 text-white ring-4 ring-stone-900/10'
                              : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          isCurrent || isCompleted ? 'text-stone-900' : 'text-stone-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-3 rounded-full ${
                          idx < currentStepIdx ? 'bg-emerald-500' : 'bg-stone-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metadata Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 sm:px-8 py-4 bg-stone-50/70 border-b border-stone-100 text-xs">
            <div className="flex items-center gap-2.5">
              <UserIcon className="w-4 h-4 text-stone-400 shrink-0" />
              <div>
                <span className="text-stone-400 block">Customer</span>
                <span className="font-medium text-stone-800">{inquiry.customerName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-stone-400 shrink-0" />
              <div>
                <span className="text-stone-400 block">Contact</span>
                <span className="font-medium text-stone-800">{inquiry.customerContact}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-stone-400 shrink-0" />
              <div>
                <span className="text-stone-400 block">Recorded</span>
                <span className="font-medium text-stone-800">
                  {new Date(inquiry.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 sm:px-8 py-6 border-b border-stone-100">
            <h2 className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-2">
              Inquiry Details
            </h2>
            <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">
              {inquiry.description}
            </p>
          </div>

          {/* Action Footer */}
          <div className="px-6 sm:px-8 py-5 bg-stone-50/40 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-stone-400">
              Recorded by <span className="font-medium text-stone-600">{inquiry.createdBy?.name || 'Staff'}</span>
            </div>

            <div>
              {inquiry.status === 'NEW' && (
                <button
                  disabled={updating}
                  onClick={() => updateStatus('IN_PROGRESS')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  {updating ? 'Updating...' : 'Start Working (In Progress)'}
                </button>
              )}

              {inquiry.status === 'IN_PROGRESS' && (
                <button
                  disabled={updating}
                  onClick={() => updateStatus('RESOLVED')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {updating ? 'Updating...' : 'Mark as Resolved'}
                </button>
              )}

              {inquiry.status === 'RESOLVED' && (
                <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3.5 py-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  Resolved (Final State)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}