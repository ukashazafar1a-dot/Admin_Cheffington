'use client';

import { useEffect, useState } from 'react';
import { APIClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';

type PublishedRestaurantRef = {
  _id: string;
  name?: string;
  cuisine?: string;
  city?: string;
  state?: string;
  status?: string;
};

type RestaurantSuggestion = {
  _id: string;
  name: string;
  cuisine?: string;
  phone?: string;
  website?: string;
  menuUrl?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  description?: string;
  features?: string[];
  submitterName?: string;
  submitterEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  publishedRestaurantId?: string | PublishedRestaurantRef | null;
  createdAt?: string;
};

const PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || 'http://localhost:3000';

function publishedRestaurantId(
  suggestion: RestaurantSuggestion
): string | null {
  const value = suggestion.publishedRestaurantId;
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id || null;
}

type ToastItem = {
  id: number;
  type: 'success' | 'error';
  message: string;
};

export default function RestaurantSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<RestaurantSuggestion[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const pushToast = (type: ToastItem['type'], message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  };

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError('');
      const [listResponse, pendingResponse, approvedResponse, rejectedResponse] =
        await Promise.all([
          APIClient.getRestaurantSuggestions({
            status: statusFilter === 'all' ? undefined : statusFilter,
            limit: 100,
          }),
          APIClient.getRestaurantSuggestions({ status: 'pending', limit: 1 }),
          APIClient.getRestaurantSuggestions({ status: 'approved', limit: 1 }),
          APIClient.getRestaurantSuggestions({ status: 'rejected', limit: 1 }),
        ]);

      if (listResponse.success) {
        setSuggestions(listResponse.data || []);
      }
      setStats({
        pending: pendingResponse.count ?? 0,
        approved: approvedResponse.count ?? 0,
        rejected: rejectedResponse.count ?? 0,
        total:
          (pendingResponse.count ?? 0) +
          (approvedResponse.count ?? 0) +
          (rejectedResponse.count ?? 0),
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to fetch restaurant suggestions'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, [statusFilter]);

  const reviewSuggestion = async (
    id: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      setBusyId(id);
      const response = await APIClient.updateRestaurantSuggestionStatus(
        id,
        status,
        notesById[id] || undefined
      );
      setError('');
      pushToast(
        'success',
        response.message || 'Suggestion status updated successfully'
      );
      if (statusFilter !== status) {
        setStatusFilter(status);
      } else {
        await loadSuggestions();
      }
    } catch (updateError) {
      const msg =
        updateError instanceof Error
          ? updateError.message
          : 'Failed to update suggestion';
      setError(msg);
      pushToast('error', msg);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="text-neutral-800">Loading restaurant suggestions...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950">
            Restaurant Suggestions
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Public add-listing submissions. Approve to publish an unclaimed
            restaurant (chefs can then review it).
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value as 'all' | 'pending' | 'approved' | 'rejected'
            )
          }
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className="text-left"
        >
          <Card
            className={`p-4 transition ${
              statusFilter === 'all' ? 'ring-2 ring-[#ff8400]' : ''
            }`}
          >
            <p className="text-xs text-neutral-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className="text-left"
        >
          <Card
            className={`p-4 transition ${
              statusFilter === 'pending' ? 'ring-2 ring-[#ff8400]' : ''
            }`}
          >
            <p className="text-xs text-neutral-500">Pending</p>
            <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('approved')}
          className="text-left"
        >
          <Card
            className={`p-4 transition ${
              statusFilter === 'approved' ? 'ring-2 ring-[#ff8400]' : ''
            }`}
          >
            <p className="text-xs text-neutral-500">Approved</p>
            <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('rejected')}
          className="text-left"
        >
          <Card
            className={`p-4 transition ${
              statusFilter === 'rejected' ? 'ring-2 ring-[#ff8400]' : ''
            }`}
          >
            <p className="text-xs text-neutral-500">Rejected</p>
            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
          </Card>
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-4">
        {suggestions.length === 0 ? (
          <Card className="p-6 text-sm text-neutral-600">
            No restaurant suggestions for this filter.
          </Card>
        ) : (
          suggestions.map((suggestion) => (
            <Card key={suggestion._id} className="space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950">
                    {suggestion.name}
                  </h2>
                  <p className="text-sm text-neutral-700">
                    {[suggestion.cuisine, suggestion.city, suggestion.state]
                      .filter(Boolean)
                      .join(' · ') || '-'}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Submitted {formatDateTime(suggestion.createdAt)}
                    {suggestion.submitterEmail
                      ? ` · ${suggestion.submitterName || 'Submitter'} <${suggestion.submitterEmail}>`
                      : ''}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                  {suggestion.status}
                </span>
              </div>

              <div className="grid gap-2 text-sm text-neutral-800 sm:grid-cols-2">
                <p>
                  <span className="font-medium">Phone:</span>{' '}
                  {suggestion.phone || '-'}
                </p>
                <p>
                  <span className="font-medium">Website:</span>{' '}
                  {suggestion.website || '-'}
                </p>
                <p className="sm:col-span-2">
                  <span className="font-medium">Address:</span>{' '}
                  {[
                    suggestion.addressLine1,
                    suggestion.addressLine2,
                    suggestion.city,
                    suggestion.state,
                    suggestion.zipCode,
                    suggestion.country,
                  ]
                    .filter(Boolean)
                    .join(', ') || '-'}
                </p>
                {suggestion.description ? (
                  <p className="sm:col-span-2">
                    <span className="font-medium">Description:</span>{' '}
                    {suggestion.description}
                  </p>
                ) : null}
                {suggestion.menuUrl ? (
                  <p className="sm:col-span-2">
                    <span className="font-medium">Menu:</span>{' '}
                    {suggestion.menuUrl}
                  </p>
                ) : null}
                {suggestion.features?.length ? (
                  <p className="sm:col-span-2">
                    <span className="font-medium">Features:</span>{' '}
                    {suggestion.features.join(', ')}
                  </p>
                ) : null}
                {(() => {
                  const restaurantId = publishedRestaurantId(suggestion);
                  const published =
                    suggestion.publishedRestaurantId &&
                    typeof suggestion.publishedRestaurantId === 'object'
                      ? suggestion.publishedRestaurantId
                      : null;
                  if (!restaurantId) return null;
                  return (
                    <div className="sm:col-span-2 rounded-md border border-green-200 bg-green-50 p-3">
                      <p className="font-medium text-green-900">
                        Published restaurant
                      </p>
                      <p className="mt-1 text-sm text-green-900">
                        {published?.name || suggestion.name}
                        {published?.cuisine || suggestion.cuisine
                          ? ` · ${published?.cuisine || suggestion.cuisine}`
                          : ''}
                        {published?.city || suggestion.city
                          ? ` · ${[published?.city || suggestion.city, published?.state || suggestion.state]
                              .filter(Boolean)
                              .join(', ')}`
                          : ''}
                        {published?.status ? ` · ${published.status}` : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3">
                        <a
                          href={`${PUBLIC_APP_URL}/restaurants/${restaurantId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-green-800 underline"
                        >
                          Open public page
                        </a>
                        <a
                          href="/Admin/dashboard/restaurants"
                          className="text-sm font-semibold text-green-800 underline"
                        >
                          View in Restaurants
                        </a>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {suggestion.status === 'pending' ? (
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <textarea
                    value={notesById[suggestion._id] || ''}
                    onChange={(e) =>
                      setNotesById((prev) => ({
                        ...prev,
                        [suggestion._id]: e.target.value,
                      }))
                    }
                    placeholder="Admin notes (optional)"
                    className="min-h-20 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === suggestion._id}
                      onClick={() =>
                        reviewSuggestion(suggestion._id, 'approved')
                      }
                      className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {busyId === suggestion._id ? 'Saving…' : 'Approve & publish'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === suggestion._id}
                      onClick={() =>
                        reviewSuggestion(suggestion._id, 'rejected')
                      }
                      className="rounded border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : suggestion.adminNotes ? (
                <p className="text-sm text-neutral-700">
                  <span className="font-medium">Admin notes:</span>{' '}
                  {suggestion.adminNotes}
                </p>
              ) : null}
            </Card>
          ))
        )}
      </div>

      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded px-4 py-2 text-sm text-white shadow ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
