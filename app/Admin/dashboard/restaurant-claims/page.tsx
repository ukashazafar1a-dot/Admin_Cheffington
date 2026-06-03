'use client';

import { useEffect, useState } from 'react';
import { APIClient } from '@/lib/api-client';
import type { RestaurantClaim } from '@/lib/types';
import { Card } from '@/components/ui/card';

type ToastItem = {
  id: number;
  type: 'success' | 'error';
  message: string;
};

export default function RestaurantClaimsPage() {
  const [claims, setClaims] = useState<RestaurantClaim[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [rejectionEmailById, setRejectionEmailById] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('pending');

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

  const loadClaims = async () => {
    try {
      setLoading(true);
      setError('');
      const [listResponse, pendingResponse, approvedResponse, rejectedResponse] =
        await Promise.all([
          APIClient.getRestaurantClaims({
            status: statusFilter === 'all' ? undefined : statusFilter,
            limit: 100,
          }),
          APIClient.getRestaurantClaims({ status: 'pending', limit: 1 }),
          APIClient.getRestaurantClaims({ status: 'approved', limit: 1 }),
          APIClient.getRestaurantClaims({ status: 'rejected', limit: 1 }),
        ]);

      if (listResponse.success) {
        setClaims(listResponse.data || []);
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
          : 'Failed to fetch restaurant claims'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, [statusFilter]);

  const reviewClaim = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const rejectionEmailMessage = rejectionEmailById[id]?.trim();
      if (status === 'rejected' && !rejectionEmailMessage) {
        const msg = 'Please write rejection email message before rejecting.';
        setError(msg);
        pushToast('error', msg);
        return;
      }
      const response = await APIClient.updateRestaurantClaimStatus(
        id,
        status,
        notesById[id] || undefined,
        rejectionEmailMessage || undefined
      );
      setError('');
      pushToast('success', response.message || 'Claim status updated successfully');
      await loadClaims();
    } catch (updateError) {
      const msg =
        updateError instanceof Error
          ? updateError.message
          : 'Failed to update claim';
      setError(msg);
      pushToast('error', msg);
    }
  };

  if (loading) {
    return <p className="text-neutral-800">Loading restaurant claims...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-64 rounded-md px-4 py-3 text-sm text-white shadow-lg ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Restaurant Claims</h1>
        <select
          className="rounded border border-slate-300 px-3 py-2"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value as 'all' | 'pending' | 'approved' | 'rejected'
            )
          }
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="mb-2 grid grid-cols-1 gap-4 md:grid-cols-4">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className="text-left"
        >
          <Card
            className={`p-6 ${
              statusFilter === 'all' ? 'ring-2 ring-[#ff8400]' : ''
            }`}
          >
            <p className="text-sm font-medium text-neutral-950">Total</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className="text-left"
        >
          <Card
            className={`p-6 ${
              statusFilter === 'pending' ? 'ring-2 ring-[#ff8400]' : ''
            }`}
          >
            <p className="text-sm font-medium text-neutral-950">Pending Review</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('approved')}
          className="text-left"
        >
          <Card
            className={`p-6 ${
              statusFilter === 'approved' ? 'ring-2 ring-[#ff8400]' : ''
            }`}
          >
            <p className="text-sm font-medium text-neutral-950">Approved</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{stats.approved}</p>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('rejected')}
          className="text-left"
        >
          <Card
            className={`p-6 ${
              statusFilter === 'rejected' ? 'ring-2 ring-[#ff8400]' : ''
            }`}
          >
            <p className="text-sm font-medium text-neutral-950">Rejected</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{stats.rejected}</p>
          </Card>
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!claims.length ? (
        <p className="text-neutral-700">No claims found.</p>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim._id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-slate-900">
                  {claim.restaurantId?.name || 'Unknown restaurant'}
                </h2>
                <span className="rounded bg-slate-100 px-2 py-1 text-sm capitalize">
                  {claim.status}
                </span>
              </div>
              <p className="text-sm text-slate-700">
                {claim.restaurantId?.city}, {claim.restaurantId?.state}, {claim.restaurantId?.country}
              </p>
              <p className="mt-2 text-sm">
                <span className="font-semibold">Claimant:</span> {claim.claimantName} ({claim.claimantEmail})
              </p>
              <p className="text-sm">
                <span className="font-semibold">Phone:</span> {claim.claimantPhone}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Relationship:</span> {claim.relationshipToBusiness}
              </p>
              {claim.jobTitle ? (
                <p className="text-sm">
                  <span className="font-semibold">Job title:</span> {claim.jobTitle}
                </p>
              ) : null}
              <p className="mt-2 text-sm">
                <span className="font-semibold">Proof summary:</span> {claim.proofSummary}
              </p>
              {claim.proofDocumentUrls?.length ? (
                <div className="mt-3">
                  <p className="mb-2 text-sm font-semibold">Attachments</p>
                  <div className="flex flex-wrap gap-2">
                    {claim.proofDocumentUrls.map((url, idx) => (
                      <a
                        key={`${claim._id}-attachment-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-slate-300 px-2 py-1 text-xs underline hover:bg-slate-50"
                      >
                        View file {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {claim.status === 'pending' ? (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={notesById[claim._id] || ''}
                    onChange={(e) =>
                      setNotesById((prev) => ({ ...prev, [claim._id]: e.target.value }))
                    }
                    placeholder="Admin notes (required for rejection)"
                    className="min-h-20 w-full rounded border border-slate-300 p-2 text-sm"
                  />
                  <textarea
                    value={rejectionEmailById[claim._id] || ''}
                    onChange={(e) =>
                      setRejectionEmailById((prev) => ({
                        ...prev,
                        [claim._id]: e.target.value,
                      }))
                    }
                    placeholder="Rejection email message to claimant (required for rejection)"
                    className="min-h-20 w-full rounded border border-slate-300 p-2 text-sm"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => reviewClaim(claim._id, 'approved')}
                      className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewClaim(claim._id, 'rejected')}
                      className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-1 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold">Reviewed at:</span>{' '}
                    {formatDateTime(claim.reviewedAt)}
                  </p>
                  <p>
                    <span className="font-semibold">Reviewed by:</span>{' '}
                    {claim.reviewedBy?.name || claim.reviewedBy?.email || '-'}
                  </p>
                  <p>
                    <span className="font-semibold">Admin notes:</span>{' '}
                    {claim.adminNotes || '-'}
                  </p>
                  {claim.status === 'rejected' ? (
                    <p>
                      <span className="font-semibold">Rejection email message:</span>{' '}
                      {claim.rejectionEmailMessage || '-'}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
