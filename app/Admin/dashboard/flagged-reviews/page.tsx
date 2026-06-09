'use client';

import { useEffect, useState } from 'react';
import { APIClient } from '@/lib/api-client';
import type { FlaggedReview } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type ToastItem = {
  id: number;
  type: 'success' | 'error';
  message: string;
};

type EditForm = {
  title: string;
  comment: string;
  adminNotes: string;
};

export default function FlaggedReviewsPage() {
  const [reviews, setReviews] = useState<FlaggedReview[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    title: '',
    comment: '',
    adminNotes: '',
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [denyingId, setDenyingId] = useState<string | null>(null);

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

  const chefName = (review: FlaggedReview) => {
    if (!review.chef) return '-';
    return `${review.chef.firstName} ${review.chef.lastName}`.trim();
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const [listRes, countRes] = await Promise.all([
        APIClient.getFlaggedReviews({ search: search || undefined, limit: 50 }),
        APIClient.getFlaggedReviewsCount(),
      ]);

      if (listRes.success) {
        setReviews(Array.isArray(listRes.data) ? listRes.data : []);
        setTotalCount(listRes.count ?? 0);
      }
      if (countRes.success) {
        setPendingCount(countRes.count ?? 0);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load flagged reviews'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [search]);

  const startEdit = (review: FlaggedReview) => {
    setEditingId(review._id);
    setEditForm({
      title: review.title || '',
      comment: review.comment,
      adminNotes: review.adminNotes || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', comment: '', adminNotes: '' });
  };

  const handleSaveEdit = async (id: string) => {
    const trimmedComment = editForm.comment.trim();
    if (!trimmedComment) {
      pushToast('error', 'Comment cannot be empty');
      return;
    }

    try {
      setSavingId(id);
      await APIClient.updateFlaggedReview(id, {
        title: editForm.title.trim() || undefined,
        comment: trimmedComment,
        adminNotes: editForm.adminNotes.trim() || undefined,
      });
      pushToast('success', 'Review updated');
      cancelEdit();
      await loadReviews();
    } catch (saveError) {
      pushToast(
        'error',
        saveError instanceof Error ? saveError.message : 'Failed to update review'
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleApprove = async (review: FlaggedReview) => {
    const confirmed = window.confirm(
      'Approve and publish this review? It will appear on the restaurant page even if it still contains flagged language.'
    );
    if (!confirmed) return;

    try {
      setApprovingId(review._id);
      const res = await APIClient.approveFlaggedReview(
        review._id,
        review.adminNotes || undefined
      );
      pushToast('success', res.message || 'Review approved');
      if (editingId === review._id) cancelEdit();
      await loadReviews();
    } catch (approveError) {
      pushToast(
        'error',
        approveError instanceof Error ? approveError.message : 'Failed to approve review'
      );
    } finally {
      setApprovingId(null);
    }
  };

  const handleDeny = async (review: FlaggedReview) => {
    const confirmed = window.confirm(
      'Deny and remove this review? It will be permanently hidden from the public site.'
    );
    if (!confirmed) return;

    try {
      setDenyingId(review._id);
      const res = await APIClient.denyFlaggedReview(
        review._id,
        review.adminNotes || undefined
      );
      pushToast('success', res.message || 'Review denied');
      if (editingId === review._id) cancelEdit();
      await loadReviews();
    } catch (denyError) {
      pushToast(
        'error',
        denyError instanceof Error ? denyError.message : 'Failed to deny review'
      );
    } finally {
      setDenyingId(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Flagged Reviews</h1>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Reviews auto-flagged by banned phrases are held here until you approve,
          deny, or edit them. Approved reviews go live on the restaurant page.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Pending flagged reviews</p>
          <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Showing (filtered)</p>
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
        </Card>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by restaurant, chef, or review text"
            className="flex-1"
          />
          <button
            type="submit"
            className="rounded-md bg-[#ff8400] px-4 py-2 text-sm font-medium text-white hover:bg-[#e67600]"
          >
            Search
          </button>
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSearchInput('');
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          ) : null}
        </form>

        {loading ? (
          <p className="text-gray-500">Loading flagged reviews...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-500">No flagged reviews.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-3 pr-4 font-medium">Restaurant</th>
                  <th className="py-3 pr-4 font-medium">Chef</th>
                  <th className="py-3 pr-4 font-medium">Review</th>
                  <th className="py-3 pr-4 font-medium">Why flagged</th>
                  <th className="py-3 pr-4 font-medium">Date</th>
                  <th className="py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => {
                  const isEditing = editingId === review._id;
                  const location = [review.restaurant?.city, review.restaurant?.state]
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <tr key={review._id} className="border-b border-gray-100 align-top">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900">
                          {review.restaurant?.name || '-'}
                        </p>
                        {location ? (
                          <p className="text-xs text-gray-500">{location}</p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-gray-900">{chefName(review)}</p>
                        {review.chef?.email ? (
                          <p className="text-xs text-gray-500">{review.chef.email}</p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 max-w-xs">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editForm.title}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, title: e.target.value }))
                              }
                              placeholder="Title (optional)"
                              maxLength={120}
                            />
                            <textarea
                              value={editForm.comment}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, comment: e.target.value }))
                              }
                              rows={4}
                              maxLength={5000}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                            <Input
                              value={editForm.adminNotes}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, adminNotes: e.target.value }))
                              }
                              placeholder="Admin notes (optional)"
                              maxLength={500}
                            />
                          </div>
                        ) : (
                          <div>
                            {review.title ? (
                              <p className="font-medium text-gray-900">{review.title}</p>
                            ) : null}
                            <p className="text-gray-700 whitespace-pre-wrap break-words">
                              {review.comment}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 max-w-xs">
                        {review.flaggedReason || '-'}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                        {formatDateTime(review.createdAt)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex flex-col items-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(review._id)}
                                disabled={savingId === review._id}
                                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {savingId === review._id ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={savingId === review._id}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(review)}
                                disabled={
                                  approvingId === review._id ||
                                  denyingId === review._id ||
                                  editingId !== null
                                }
                                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {approvingId === review._id ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeny(review)}
                                disabled={
                                  approvingId === review._id ||
                                  denyingId === review._id ||
                                  editingId !== null
                                }
                                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {denyingId === review._id ? 'Denying...' : 'Deny'}
                              </button>
                              <button
                                type="button"
                                onClick={() => startEdit(review)}
                                disabled={
                                  approvingId === review._id ||
                                  denyingId === review._id ||
                                  editingId !== null
                                }
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {toasts.length > 0 ? (
        <div className="fixed bottom-6 right-6 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-lg px-4 py-3 text-sm shadow-lg ${
                toast.type === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
