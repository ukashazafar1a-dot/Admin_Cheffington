'use client';

import { useEffect, useState } from 'react';
import { APIClient } from '@/lib/api-client';
import type { AdminRestaurant, AdminRestaurantReview } from '@/lib/types';
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
};

const PAGE_SIZE = 20;

export default function RestaurantReviewsPage() {
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [debouncedRestaurantSearch, setDebouncedRestaurantSearch] = useState('');
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<{
    id: string;
    name: string;
    city?: string;
    state?: string;
  } | null>(null);

  const [reviews, setReviews] = useState<AdminRestaurantReview[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [reviewSearch, setReviewSearch] = useState('');
  const [debouncedReviewSearch, setDebouncedReviewSearch] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: '', comment: '' });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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

  const chefName = (review: AdminRestaurantReview) => {
    if (!review.chef) return '-';
    return `${review.chef.firstName} ${review.chef.lastName}`.trim();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedRestaurantSearch(restaurantSearch);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [restaurantSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedReviewSearch(reviewSearch);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [reviewSearch]);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setRestaurantsLoading(true);
        const res = await APIClient.getAdminRestaurants({
          search: debouncedRestaurantSearch.trim() || undefined,
          limit: 50,
        });
        if (res.success) {
          setRestaurants(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        setRestaurants([]);
      } finally {
        setRestaurantsLoading(false);
      }
    };

    loadRestaurants();
  }, [debouncedRestaurantSearch]);

  useEffect(() => {
    if (!selectedRestaurant) {
      setReviews([]);
      setTotalCount(0);
      return;
    }

    const loadReviews = async () => {
      try {
        setReviewsLoading(true);
        setError('');
        const res = await APIClient.getRestaurantReviewsForAdmin(selectedRestaurant.id, {
          page,
          limit: PAGE_SIZE,
          search: debouncedReviewSearch.trim() || undefined,
        });

        if (res.success) {
          setReviews(Array.isArray(res.data) ? res.data : []);
          setTotalCount(res.count ?? 0);
          if (res.restaurant) {
            setSelectedRestaurant({
              id: res.restaurant.id,
              name: res.restaurant.name,
              city: res.restaurant.city,
              state: res.restaurant.state,
            });
          }
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load restaurant reviews'
        );
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, [selectedRestaurant?.id, page, debouncedReviewSearch]);

  const handleSelectRestaurant = (restaurant: AdminRestaurant) => {
    setSelectedRestaurant({
      id: restaurant._id,
      name: restaurant.name,
      city: restaurant.city,
      state: restaurant.state,
    });
    setPage(1);
    setReviewSearch('');
    setDebouncedReviewSearch('');
    setError('');
    cancelEdit();
  };

  const reloadReviews = async () => {
    if (!selectedRestaurant) return;

    const reload = await APIClient.getRestaurantReviewsForAdmin(selectedRestaurant.id, {
      page,
      limit: PAGE_SIZE,
      search: debouncedReviewSearch.trim() || undefined,
    });
    if (reload.success) {
      setReviews(Array.isArray(reload.data) ? reload.data : []);
      setTotalCount(reload.count ?? 0);
    }
  };

  const startEdit = (review: AdminRestaurantReview) => {
    setEditingId(review._id);
    setEditForm({
      title: review.title || '',
      comment: review.comment,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', comment: '' });
  };

  const handleSaveEdit = async (id: string) => {
    const trimmedComment = editForm.comment.trim();
    if (!trimmedComment) {
      pushToast('error', 'Comment cannot be empty');
      return;
    }

    try {
      setSavingId(id);
      const res = await APIClient.updatePublishedReview(id, {
        title: editForm.title.trim() || undefined,
        comment: trimmedComment,
      });
      pushToast('success', res.message || 'Review updated');
      cancelEdit();
      await reloadReviews();
    } catch (saveError) {
      pushToast(
        'error',
        saveError instanceof Error ? saveError.message : 'Failed to update review'
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleRemove = async (review: AdminRestaurantReview) => {
    const confirmed = window.confirm(
      'Remove this review from the public site? It will be hidden permanently.'
    );
    if (!confirmed) return;

    try {
      setRemovingId(review._id);
      const res = await APIClient.removePublishedReview(review._id);
      pushToast('success', res.message || 'Review removed');
      if (editingId === review._id) cancelEdit();
      if (reviews.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await reloadReviews();
      }
    } catch (removeError) {
      pushToast(
        'error',
        removeError instanceof Error ? removeError.message : 'Failed to remove review'
      );
    } finally {
      setRemovingId(null);
    }
  };

  const location = selectedRestaurant
    ? [selectedRestaurant.city, selectedRestaurant.state].filter(Boolean).join(', ')
    : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Restaurant Reviews</h1>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Pick a restaurant to browse its live reviews (20 per page). Edit or remove
          reviews that slipped past the banned-phrase list.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Select restaurant</h2>
        <Input
          value={restaurantSearch}
          onChange={(e) => setRestaurantSearch(e.target.value)}
          placeholder="Search restaurants by name..."
          className="max-w-md mb-4"
        />

        {restaurantsLoading ? (
          <p className="text-gray-500 text-sm">Searching restaurants...</p>
        ) : restaurants.length === 0 ? (
          <p className="text-gray-500 text-sm">No restaurants found.</p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {restaurants.map((restaurant) => (
              <button
                key={restaurant._id}
                type="button"
                onClick={() => handleSelectRestaurant(restaurant)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  selectedRestaurant?.id === restaurant._id
                    ? 'border-[#ff8400] bg-[#ff8400] text-white'
                    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                }`}
              >
                {restaurant.name}
                {restaurant.city ? ` (${restaurant.city})` : ''}
              </button>
            ))}
          </div>
        )}
      </Card>

      {selectedRestaurant ? (
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedRestaurant.name}
              </h2>
              {location ? <p className="text-sm text-gray-500">{location}</p> : null}
              <p className="text-sm text-gray-500 mt-1">
                {totalCount} review{totalCount === 1 ? '' : 's'} total
              </p>
            </div>
            <Input
              value={reviewSearch}
              onChange={(e) => setReviewSearch(e.target.value)}
              placeholder="Search review text..."
              className="max-w-xs"
            />
          </div>

          {reviewsLoading ? (
            <p className="text-gray-500">Loading reviews...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500">No published or flagged reviews for this restaurant.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="py-3 pr-4 font-medium">Chef</th>
                      <th className="py-3 pr-4 font-medium">Review</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 pr-4 font-medium">Date</th>
                      <th className="py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review) => {
                      const isEditing = editingId === review._id;
                      const canEdit = review.status === 'published';

                      return (
                        <tr key={review._id} className="border-b border-gray-100 align-top">
                          <td className="py-3 pr-4">
                            <p className="text-gray-900">{chefName(review)}</p>
                            {review.chef?.email ? (
                              <p className="text-xs text-gray-500">{review.chef.email}</p>
                            ) : null}
                          </td>
                          <td className="py-3 pr-4 max-w-md">
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
                              </div>
                            ) : (
                              <div>
                                {review.title ? (
                                  <p className="font-medium text-gray-900">{review.title}</p>
                                ) : null}
                                <p className="text-gray-700 whitespace-pre-wrap break-words">
                                  {review.comment}
                                </p>
                                {review.flaggedReason ? (
                                  <p className="text-xs text-amber-700 mt-1">
                                    {review.flaggedReason}
                                  </p>
                                ) : null}
                                {review.adminEditedAt ? (
                                  <p className="text-xs text-blue-700 mt-1">
                                    Edited by admin • {formatDateTime(review.adminEditedAt)}
                                  </p>
                                ) : null}
                              </div>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                                review.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {review.status}
                            </span>
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
                                  {canEdit ? (
                                    <button
                                      type="button"
                                      onClick={() => startEdit(review)}
                                      disabled={
                                        removingId === review._id ||
                                        editingId !== null
                                      }
                                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                      Edit
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => handleRemove(review)}
                                    disabled={
                                      removingId === review._id ||
                                      editingId !== null
                                    }
                                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                  >
                                    {removingId === review._id ? 'Removing...' : 'Remove'}
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

              {totalPages > 1 ? (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || reviewsLoading}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages || reviewsLoading}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Card>
      ) : (
        <Card className="p-6">
          <p className="text-gray-500">Select a restaurant above to view its reviews.</p>
        </Card>
      )}

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
