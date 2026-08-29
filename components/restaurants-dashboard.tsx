'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { APIClient } from '@/lib/api-client';
import type { AdminRestaurant, AdminRestaurantDetail } from '@/lib/types';

type RestaurantStatusFilter = 'all' | 'draft' | 'published' | 'archived';
type ClaimedFilter = 'all' | 'claimed' | 'unclaimed';

type ToastItem = {
  id: number;
  type: 'success' | 'error';
  message: string;
};

export function RestaurantsDashboard() {
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [debouncedOwnerSearch, setDebouncedOwnerSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<RestaurantStatusFilter>('all');
  const [claimedFilter, setClaimedFilter] = useState<ClaimedFilter>('all');
  const [cities, setCities] = useState<string[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<AdminRestaurantDetail | null>(null);
  const [listingCuisine, setListingCuisine] = useState('');
  const [listingTagline, setListingTagline] = useState('');
  const [listingSaving, setListingSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    published: 0,
    archived: 0,
  });

  const pushToast = (type: ToastItem['type'], message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await APIClient.getAdminRestaurants({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined,
        city: cityFilter === 'all' ? undefined : cityFilter,
        claimed: claimedFilter === 'all' ? undefined : claimedFilter,
        owner: debouncedOwnerSearch.trim() || undefined,
        limit: 200,
      });
      if (response.success) {
        setRestaurants(response.data || []);
        setCities(Array.isArray(response.cities) ? response.cities : []);
        setStats({
          total: response.stats?.total ?? 0,
          draft: response.stats?.draft ?? 0,
          published: response.stats?.published ?? 0,
          archived: response.stats?.archived ?? 0,
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedOwnerSearch(ownerSearch);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [ownerSearch]);

  useEffect(() => {
    loadRestaurants();
  }, [statusFilter, debouncedSearch, cityFilter, claimedFilter, debouncedOwnerSearch]);

  const openDetails = async (id: string) => {
    try {
      setDetailLoading(true);
      const response = await APIClient.getAdminRestaurant(id);
      if (response.success) {
        setSelectedRestaurant(response.data);
        setListingCuisine(response.data?.cuisine || '');
        setListingTagline(response.data?.tagline || '');
      }
    } catch (detailError) {
      const msg =
        detailError instanceof Error
          ? detailError.message
          : 'Failed to load restaurant details';
      setError(msg);
      pushToast('error', msg);
    } finally {
      setDetailLoading(false);
    }
  };

  const saveListingFields = async () => {
    if (!selectedRestaurant?._id) return;
    try {
      setListingSaving(true);
      const response = await APIClient.updateAdminRestaurantListing(
        selectedRestaurant._id,
        {
          cuisine: listingCuisine,
          tagline: listingTagline,
        }
      );
      setSelectedRestaurant((prev) =>
        prev
          ? {
              ...prev,
              cuisine: response.data?.cuisine ?? listingCuisine,
              tagline: response.data?.tagline ?? listingTagline,
            }
          : prev
      );
      pushToast('success', response.message || 'Cuisine and tagline updated');
      await loadRestaurants();
    } catch (listingError) {
      const msg =
        listingError instanceof Error
          ? listingError.message
          : 'Failed to update cuisine and tagline';
      setError(msg);
      pushToast('error', msg);
    } finally {
      setListingSaving(false);
    }
  };

  const updateStatus = async (
    restaurant: AdminRestaurant,
    nextStatus: 'draft' | 'published' | 'archived'
  ) => {
    try {
      const response = await APIClient.updateAdminRestaurantStatus(
        restaurant._id,
        nextStatus
      );
      pushToast('success', response.message || 'Restaurant status updated');
      await loadRestaurants();
    } catch (statusError) {
      const msg =
        statusError instanceof Error
          ? statusError.message
          : 'Failed to update restaurant status';
      setError(msg);
      pushToast('error', msg);
    }
  };

  const removeRestaurant = async (restaurant: AdminRestaurant) => {
    if (restaurant.status !== 'archived') {
      pushToast('error', 'Archive the restaurant first, then you can remove it.');
      return;
    }
    const confirmed = window.confirm(
      `Remove "${restaurant.name}" from the list? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      const response = await APIClient.deleteAdminRestaurant(restaurant._id);
      if (selectedRestaurant?._id === restaurant._id) {
        setSelectedRestaurant(null);
      }
      pushToast('success', response.message || 'Restaurant removed from the list');
      await loadRestaurants();
    } catch (removeError) {
      const msg =
        removeError instanceof Error
          ? removeError.message
          : 'Failed to remove restaurant';
      setError(msg);
      pushToast('error', msg);
    }
  };

  const reassignOwner = async (restaurant: AdminRestaurant) => {
    const ownerEmail = window.prompt(
      'Enter approved business owner email for reassignment:'
    );
    if (!ownerEmail?.trim()) return;
    try {
      const response = await APIClient.reassignAdminRestaurantOwner(
        restaurant._id,
        { ownerEmail: ownerEmail.trim() }
      );
      pushToast('success', response.message || 'Restaurant owner reassigned');
      await loadRestaurants();
    } catch (ownerError) {
      const msg =
        ownerError instanceof Error
          ? ownerError.message
          : 'Failed to reassign owner';
      setError(msg);
      pushToast('error', msg);
    }
  };

  const formattedRows = useMemo(
    () =>
      restaurants.map((restaurant) => {
        const ownerName = `${restaurant.ownerId?.firstName || ''} ${restaurant.ownerId?.lastName || ''}`.trim();
        const hasOwner = Boolean(ownerName || restaurant.ownerId?.email);
        const submitterName = restaurant.listingSubmitter?.name?.trim() || '';
        const submitterEmail = restaurant.listingSubmitter?.email?.trim() || '';
        return {
          ...restaurant,
          ownerLabel: hasOwner
            ? ownerName || restaurant.ownerId?.email || '-'
            : submitterName || '-',
          contactEmail: hasOwner
            ? restaurant.ownerId?.email || '-'
            : submitterEmail || '-',
          contactIsSubmitter: !hasOwner && Boolean(submitterName || submitterEmail),
          updatedLabel: restaurant.updatedAt
            ? new Date(restaurant.updatedAt).toLocaleDateString()
            : '-',
        };
      }),
    [restaurants]
  );

  const statusBadgeClass = (status: AdminRestaurant['status']) => {
    if (status === 'published') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'draft') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

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

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Restaurants</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <button type="button" onClick={() => setStatusFilter('all')} className="text-left">
          <Card className={`p-6 ${statusFilter === 'all' ? 'ring-2 ring-[#ff8400]' : ''}`}>
            <p className="text-sm font-medium text-neutral-950">Total Restaurants</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
          </Card>
        </button>
        <button type="button" onClick={() => setStatusFilter('published')} className="text-left">
          <Card className={`p-6 ${statusFilter === 'published' ? 'ring-2 ring-[#ff8400]' : ''}`}>
            <p className="text-sm font-medium text-neutral-950">Published</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{stats.published}</p>
          </Card>
        </button>
        <button type="button" onClick={() => setStatusFilter('draft')} className="text-left">
          <Card className={`p-6 ${statusFilter === 'draft' ? 'ring-2 ring-[#ff8400]' : ''}`}>
            <p className="text-sm font-medium text-neutral-950">Draft</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.draft}</p>
          </Card>
        </button>
        <button type="button" onClick={() => setStatusFilter('archived')} className="text-left">
          <Card className={`p-6 ${statusFilter === 'archived' ? 'ring-2 ring-[#ff8400]' : ''}`}>
            <p className="text-sm font-medium text-neutral-950">Archived</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{stats.archived}</p>
          </Card>
        </button>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Search</label>
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, cuisine, city, country..."
              className="text-neutral-950 placeholder:text-neutral-600"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">City</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-neutral-950"
            >
              <option value="all">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Claimed</label>
            <select
              value={claimedFilter}
              onChange={(e) => setClaimedFilter(e.target.value as ClaimedFilter)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-neutral-950"
            >
              <option value="all">All</option>
              <option value="claimed">Claimed</option>
              <option value="unclaimed">Unclaimed</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RestaurantStatusFilter)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-neutral-950"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Owner</label>
            <Input
              type="text"
              value={ownerSearch}
              onChange={(e) => setOwnerSearch(e.target.value)}
              placeholder="Owner name/email..."
              className="text-neutral-950 placeholder:text-neutral-600"
            />
          </div>
          <div className="md:col-span-5 flex items-end justify-end">
            <p className="text-sm font-medium text-neutral-950">
              Showing {restaurants.length} restaurants
            </p>
          </div>
        </div>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-neutral-950">Name</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-neutral-950">Cuisine</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-neutral-950">Tagline</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-neutral-950">Location</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-neutral-950">Owner</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-neutral-950">Owner Email</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-neutral-950">Claim Info</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-neutral-950">Status</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-neutral-950">Updated</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-neutral-950">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-sm text-neutral-700" colSpan={11}>
                  Loading restaurants...
                </td>
              </tr>
            ) : formattedRows.length ? (
              formattedRows.map((restaurant) => (
                <tr key={restaurant._id} className="border-b border-slate-100 align-top last:border-b-0 hover:bg-slate-50/40">
                  <td className="px-4 py-4 font-medium text-neutral-950">{restaurant.name}</td>
                  <td className="max-w-[220px] px-4 py-4 text-neutral-950">
                    <p className="line-clamp-2">{restaurant.cuisine || '-'}</p>
                  </td>
                  <td className="max-w-[220px] px-4 py-4 text-neutral-950">
                    <p className="line-clamp-2">{restaurant.tagline || '-'}</p>
                  </td>
                  <td className="px-4 py-4 text-neutral-950">
                    {[restaurant.city, restaurant.state, restaurant.country]
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </td>
                  <td className="px-4 py-4 text-neutral-950">
                    <div className="space-y-1">
                      <div>{restaurant.ownerLabel}</div>
                      {restaurant.contactIsSubmitter ? (
                        <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-[#c45d00]">
                          Add listing submitter
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-neutral-950">
                    <span className="break-all">{restaurant.contactEmail}</span>
                  </td>
                  <td className="px-4 py-4 text-neutral-950">
                    <div className="space-y-1">
                      <div>
                        {restaurant.claimInfo?.isClaimed ? (
                          <span className="inline-flex rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            Claimed
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            Unclaimed
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">
                        Last: {restaurant.claimInfo?.lastClaimStatus || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(
                        restaurant.status
                      )}`}
                    >
                      {restaurant.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-neutral-950">{restaurant.updatedLabel}</td>
                  <td className="px-4 py-4 text-neutral-950">
                    <div className="grid min-w-[210px] grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50"
                        onClick={() => openDetails(restaurant._id)}
                        disabled={detailLoading}
                      >
                        View details
                      </button>
                      <a
                        href={`${process.env.NEXT_PUBLIC_PUBLIC_APP_URL || 'http://localhost:3000'}/restaurants/${restaurant._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-slate-300 px-2 py-1 text-center text-xs font-medium hover:bg-slate-50"
                      >
                        Open public page
                      </a>
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50"
                        onClick={() => reassignOwner(restaurant)}
                      >
                        Reassign owner
                      </button>
                      {restaurant.status !== 'published' ? (
                        <button
                          type="button"
                          className="rounded border border-green-300 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                          onClick={() => updateStatus(restaurant, 'published')}
                        >
                          Publish
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded border border-yellow-300 px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-50"
                          onClick={() => updateStatus(restaurant, 'draft')}
                        >
                          Unpublish
                        </button>
                      )}
                      {restaurant.status !== 'archived' ? (
                        <button
                          type="button"
                          className="col-span-2 rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (window.confirm('Archive this restaurant?')) {
                              updateStatus(restaurant, 'archived');
                            }
                          }}
                        >
                          Archive
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="col-span-2 rounded border border-red-500 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                          onClick={() => removeRestaurant(restaurant)}
                        >
                          Remove from list
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-sm text-neutral-700" colSpan={11}>
                  No restaurants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {selectedRestaurant ? (
        <div className="fixed inset-0 z-40 bg-black/40 p-4">
          <div className="mx-auto max-w-3xl rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedRestaurant.name}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedRestaurant(null)}
                className="rounded border border-slate-300 px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div className="md:col-span-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="mb-3 text-xs text-slate-600">
                  Cuisine type belongs in Cuisine (Italian, Mexican). Put slogans in Tagline.
                  Reviews do not change these fields.
                </p>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Cuisine
                </label>
                <Input
                  value={listingCuisine}
                  onChange={(e) => setListingCuisine(e.target.value)}
                  placeholder="Italian, Mexican, …"
                  className="mb-3"
                />
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Tagline
                </label>
                <Input
                  value={listingTagline}
                  onChange={(e) => setListingTagline(e.target.value)}
                  placeholder="Short slogan — optional"
                />
                <button
                  type="button"
                  onClick={saveListingFields}
                  disabled={listingSaving}
                  className="mt-3 rounded bg-[#ff8400] px-3 py-1.5 text-sm font-medium text-black hover:bg-[#e67600] disabled:opacity-50"
                >
                  {listingSaving ? 'Saving...' : 'Save cuisine / tagline'}
                </button>
              </div>
              <p>
                <span className="font-semibold">Status:</span>{' '}
                {selectedRestaurant.status}
              </p>
              <p>
                <span className="font-semibold">Location:</span>{' '}
                {[selectedRestaurant.city, selectedRestaurant.state, selectedRestaurant.country]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </p>
              <p>
                <span className="font-semibold">
                  {selectedRestaurant.ownerId?.email
                    ? 'Owner:'
                    : selectedRestaurant.listingSubmitter?.name ||
                        selectedRestaurant.listingSubmitter?.email
                      ? 'Submitted by:'
                      : 'Owner:'}
                </span>{' '}
                {selectedRestaurant.ownerId?.firstName ||
                selectedRestaurant.ownerId?.lastName ||
                selectedRestaurant.ownerId?.email
                  ? `${selectedRestaurant.ownerId?.firstName || ''} ${selectedRestaurant.ownerId?.lastName || ''}`.trim() +
                    (selectedRestaurant.ownerId?.email
                      ? ` (${selectedRestaurant.ownerId.email})`
                      : '')
                  : selectedRestaurant.listingSubmitter?.name ||
                      selectedRestaurant.listingSubmitter?.email
                    ? `${selectedRestaurant.listingSubmitter?.name || '-'} (${selectedRestaurant.listingSubmitter?.email || '-'})`
                    : '-'}
              </p>
            </div>

            <div className="mt-4">
              <h3 className="mb-2 font-semibold text-slate-900">Recent Claims</h3>
              {selectedRestaurant.recentClaims?.length ? (
                <div className="space-y-1 text-sm text-slate-700">
                  {selectedRestaurant.recentClaims.map((claim, idx) => (
                    <p key={`${claim.createdAt}-${idx}`}>
                      {claim.status} - {claim.claimantName || '-'} ({claim.claimantEmail || '-'})
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-700">No claims found.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
