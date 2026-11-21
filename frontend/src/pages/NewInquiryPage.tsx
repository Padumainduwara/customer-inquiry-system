import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
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
    if (customerName.trim().length < 2) {
      errors.customerName = ['Customer name must be at least 2 characters'];
    }
    if (customerContact.trim().length < 5) {
      errors.customerContact = ['Enter a valid email or phone number'];
    }
    if (subject.trim().length < 3) {
      errors.subject = ['Subject must be at least 3 characters'];
    }
    if (description.trim().length < 10) {
      errors.description = ['Description must be at least 10 characters'];
    }
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
    <div className="min-h-screen bg-[#F8F7F4] py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 mb-5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Inquiry Desk
        </Link>

        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-6 sm:px-8 py-6 border-b border-stone-100">
            <h1 className="text-lg font-semibold tracking-tight text-stone-900">
              Record New Inquiry
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Log customer contact details and request context so nothing slips through the cracks.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {generalError && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{generalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="customerName"
                    className="block text-xs font-medium text-stone-700 mb-1.5"
                  >
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g., Amal Jayasinghe"
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition ${
                      fieldErrors.customerName
                        ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500'
                        : 'border-stone-300 focus:ring-stone-900/10 focus:border-stone-900'
                    }`}
                  />
                  {fieldErrors.customerName && (
                    <p className="text-xs text-red-600 mt-1.5">{fieldErrors.customerName[0]}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="customerContact"
                    className="block text-xs font-medium text-stone-700 mb-1.5"
                  >
                    Contact (Email or Phone) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customerContact"
                    type="text"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    placeholder="amal@example.com or +94 77 123 4567"
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition ${
                      fieldErrors.customerContact
                        ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500'
                        : 'border-stone-300 focus:ring-stone-900/10 focus:border-stone-900'
                    }`}
                  />
                  {fieldErrors.customerContact && (
                    <p className="text-xs text-red-600 mt-1.5">{fieldErrors.customerContact[0]}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="subject"
                    className="block text-xs font-medium text-stone-700 mb-1.5"
                  >
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Short summary of the request"
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition ${
                      fieldErrors.subject
                        ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500'
                        : 'border-stone-300 focus:ring-stone-900/10 focus:border-stone-900'
                    }`}
                  />
                  {fieldErrors.subject && (
                    <p className="text-xs text-red-600 mt-1.5">{fieldErrors.subject[0]}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="priority"
                    className="block text-xs font-medium text-stone-700 mb-1.5"
                  >
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-medium text-stone-700 mb-1.5"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about what the customer needs..."
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition ${
                    fieldErrors.description
                      ? 'border-red-300 focus:ring-red-500/15 focus:border-red-500'
                      : 'border-stone-300 focus:ring-stone-900/10 focus:border-stone-900'
                  }`}
                />
                {fieldErrors.description && (
                  <p className="text-xs text-red-600 mt-1.5">{fieldErrors.description[0]}</p>
                )}
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <Link
                  to="/"
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}