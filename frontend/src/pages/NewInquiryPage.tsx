import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiFetch, ApiError } from '../lib/api';
import type { Inquiry, Priority } from '../types';

export default function NewInquiryPage() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateClient = () => {
    const errors: Record<string, string[]> = {};
    if (customerName.trim().length < 2) errors.customerName = ['Customer name must be at least 2 characters'];
    if (customerContact.trim().length < 5) errors.customerContact = ['Enter a valid email or phone number'];
    if (subject.trim().length < 3) errors.subject = ['Subject must be at least 3 characters'];
    if (description.trim().length < 10) errors.description = ['Description must be at least 10 characters'];
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const res = await apiFetch<{ inquiry: Inquiry }>('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          customerName,
          customerContact,
          subject,
          description,
          priority,
        }),
      });
      navigate(`/inquiries/${res.inquiry.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
        if (err.details) setFieldErrors(err.details);
      } else {
        setGeneralError('Failed to save inquiry. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Inquiries
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
          <h1 className="text-xl font-bold text-slate-900">Record New Inquiry</h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Capture customer details so your team can track and resolve the request.
          </p>

          {generalError && (
            <div role="alert" className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-slate-700 mb-1">
                Customer Name *
              </label>
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., Amal Jayasinghe"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {fieldErrors.customerName && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.customerName[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="customerContact" className="block text-sm font-medium text-slate-700 mb-1">
                Contact (Email or Phone) *
              </label>
              <input
                id="customerContact"
                type="text"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                placeholder="e.g., amal@example.com or +94 77 123 4567"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {fieldErrors.customerContact && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.customerContact[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
                  Subject *
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Short summary of the request"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {fieldErrors.subject && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.subject[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about what the customer needs..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {fieldErrors.description && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.description[0]}</p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Link
                to="/"
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Save Inquiry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}