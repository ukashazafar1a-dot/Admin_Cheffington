'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { APIClient } from '@/lib/api-client';
import type { AdCampaign, AdCampaignsOverview } from '@/lib/types';
import { Card } from '@/components/ui/card';
import ComplimentaryAdForm from '@/components/complimentary-ad-form';

type PanelTab = 'overview' | 'live' | 'scheduled' | 'ended' | 'all';

const PAGE_SIZE = 20;

function formatShortDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function displayStatusBadge(status?: AdCampaign['displayStatus']) {
  switch (status) {
    case 'live':
      return 'bg-green-100 text-green-800';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'expired':
      return 'bg-gray-100 text-gray-700';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function displayStatusLabel(status?: AdCampaign['displayStatus']) {
  switch (status) {
    case 'live':
      return 'Live';
    case 'scheduled':
      return 'Scheduled';
    case 'expired':
      return 'Ended';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status || 'Unknown';
  }
}

function slotStatusBadge(status: 'live' | 'scheduled' | 'empty') {
  if (status === 'live') return 'bg-green-100 text-green-800';
  if (status === 'scheduled') return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-600';
}

function slotStatusLabel(status: 'live' | 'scheduled' | 'empty') {
  if (status === 'live') return 'Live';
  if (status === 'scheduled') return 'Scheduled';
  return 'Empty';
}

function tabButtonClass(active: boolean) {
  return `rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
    active
      ? 'bg-[#ff8400] text-white shadow-sm'
      : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
  }`;
}

function canCancelCampaign(campaign: AdCampaign) {
  return (
    campaign.displayStatus === 'live' || campaign.displayStatus === 'scheduled'
  );
}

function CampaignTable({
  campaigns,
  emptyMessage,
  onCancel,
  cancellingId,
}: {
  campaigns: AdCampaign[];
  emptyMessage: string;
  onCancel?: (campaign: AdCampaign) => Promise<void>;
  cancellingId?: string | null;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter(
      (c) =>
        c.businessName.toLowerCase().includes(q) ||
        (c.placementName || '').toLowerCase().includes(q) ||
        c.placementKey.toLowerCase().includes(q) ||
        (c.contactEmail || '').toLowerCase().includes(q)
    );
  }, [campaigns, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, campaigns.length]);

  if (!campaigns.length) {
    return (
      <Card className="p-8 text-center text-gray-600">{emptyMessage}</Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search business, placement, or email…"
          className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="text-sm text-gray-500">
          {filtered.length} result{filtered.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#fff1e1]">
            <tr>
              <th className="p-3 font-semibold">Business</th>
              <th className="p-3 font-semibold">Placement</th>
              <th className="p-3 font-semibold">Target</th>
              <th className="p-3 font-semibold">Schedule</th>
              <th className="p-3 font-semibold">Days</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">On site</th>
              <th className="p-3 font-semibold">Link</th>
              {onCancel ? <th className="p-3 font-semibold">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((campaign) => (
              <tr key={campaign._id} className="border-t border-gray-100">
                <td className="p-3 align-middle">
                  <div className="flex items-center gap-3">
                    {campaign.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={campaign.imageUrl}
                        alt=""
                        className="h-10 w-14 shrink-0 rounded border border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-[10px] text-gray-400">
                        No img
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {campaign.businessName}
                        </p>
                        {campaign.isComplimentary ||
                        campaign.campaignType === 'complimentary' ? (
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                            Complimentary
                          </span>
                        ) : null}
                      </div>
                      {campaign.contactEmail ? (
                        <p className="truncate text-xs text-gray-500">
                          {campaign.contactEmail}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="p-3 align-middle">
                  <p className="font-medium text-gray-800">
                    {campaign.placementName || campaign.placementKey}
                  </p>
                  <code className="text-xs text-gray-500">
                    {campaign.placementKey}
                  </code>
                </td>
                <td className="p-3 align-middle text-sm text-gray-700">
                  {campaign.targetRegionLabel ||
                    campaign.targetRegionKey ||
                    'Site-wide'}
                </td>
                <td className="p-3 align-middle whitespace-nowrap text-gray-700">
                  {formatShortDate(campaign.startDate)} –{' '}
                  {formatShortDate(campaign.endDate)}
                </td>
                <td className="p-3 align-middle text-gray-700">
                  {campaign.dayCount ?? '—'}
                </td>
                <td className="p-3 align-middle">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${displayStatusBadge(campaign.displayStatus)}`}
                  >
                    {displayStatusLabel(campaign.displayStatus)}
                  </span>
                </td>
                <td className="p-3 align-middle">
                  {campaign.visibleOnSite ? (
                    <span className="text-xs font-medium text-green-700">Yes</span>
                  ) : (
                    <span className="text-xs text-gray-400">No</span>
                  )}
                </td>
                <td className="p-3 align-middle">
                  {campaign.linkUrl ? (
                    <a
                      href={campaign.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#ff8400] underline"
                    >
                      Open
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                {onCancel ? (
                  <td className="p-3 align-middle">
                    {canCancelCampaign(campaign) ? (
                      <button
                        type="button"
                        disabled={cancellingId === campaign._id}
                        onClick={() => onCancel(campaign)}
                        className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {cancellingId === campaign._id ? 'Cancelling…' : 'Cancel ad'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-gray-500">No matches for your search.</p>
      ) : null}

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function LiveAdsPanel() {
  const [overview, setOverview] = useState<AdCampaignsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<PanelTab>('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await APIClient.getAdCampaigns();
      if (response.success) {
        setOverview(response.data as AdCampaignsOverview);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load live ads'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const campaignsByTab = useMemo(() => {
    const all = overview?.campaigns ?? [];
    return {
      live: all.filter((c) => c.displayStatus === 'live'),
      scheduled: all.filter((c) => c.displayStatus === 'scheduled'),
      ended: all.filter(
        (c) =>
          c.displayStatus === 'expired' || c.displayStatus === 'cancelled'
      ),
      all,
    };
  }, [overview?.campaigns]);

  if (loading) {
    return <p className="text-neutral-800">Loading live ads...</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!overview) {
    return (
      <Card className="p-8 text-center text-gray-600">
        Could not load campaign data.
      </Card>
    );
  }

  const { summary, slots } = overview;
  const liveCampaigns = summary.liveCampaigns ?? summary.liveNow ?? 0;

  const handleComplimentaryCreated = async () => {
    setShowCreateForm(false);
    setSuccessMessage('Complimentary ad created successfully.');
    await loadCampaigns();
  };

  const handleCancelCampaign = async (campaign: AdCampaign) => {
    const label = campaign.businessName || 'this ad';
    const confirmed = window.confirm(
      `Cancel "${label}"?\n\nIt will be removed from the site immediately. This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setCancellingId(campaign._id);
      setError('');
      const response = await APIClient.cancelAdCampaign(campaign._id);
      if (response.success) {
        setSuccessMessage(`"${label}" was cancelled successfully.`);
        await loadCampaigns();
      }
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : 'Failed to cancel ad'
      );
    } finally {
      setCancellingId(null);
    }
  };

  const tabs: { id: PanelTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Site overview' },
    { id: 'live', label: 'Live on site', count: campaignsByTab.live.length },
    {
      id: 'scheduled',
      label: 'Scheduled',
      count: campaignsByTab.scheduled.length,
    },
    { id: 'ended', label: 'Ended', count: campaignsByTab.ended.length },
    { id: 'all', label: 'All campaigns', count: campaignsByTab.all.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          One row per site slot in overview. Campaign lists are split by status
          with search and pagination.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSuccessMessage('');
              setShowCreateForm((current) => !current);
            }}
            className="rounded-md bg-[#ff8400] px-4 py-2 text-sm font-semibold text-black hover:bg-[#e67600]"
          >
            {showCreateForm ? 'Close form' : 'Create complimentary ad'}
          </button>
          <button
            type="button"
            onClick={loadCampaigns}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      {showCreateForm ? (
        <ComplimentaryAdForm
          onCreated={handleComplimentaryCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: 'Live slots',
            value: summary.liveSlots ?? 0,
            className: 'text-green-600',
          },
          {
            label: 'Live campaigns',
            value: liveCampaigns,
            className: 'text-green-700',
          },
          {
            label: 'Scheduled',
            value: summary.scheduled,
            className: 'text-blue-600',
          },
          {
            label: 'Ended',
            value: summary.expired,
            className: 'text-gray-600',
          },
          {
            label: 'Empty slots',
            value: summary.emptySlots,
            className: 'text-amber-600',
          },
          {
            label: 'Total campaigns',
            value: summary.totalCampaigns ?? campaignsByTab.all.length,
            className: 'text-gray-900',
          },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {item.label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${item.className}`}>
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={tabButtonClass(activeTab === tab.id)}
          >
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span className="ml-1.5 opacity-80">({tab.count})</span>
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#fff1e1]">
              <tr>
                <th className="p-3 font-semibold">Placement</th>
                <th className="p-3 font-semibold">Where on site</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Showing now</th>
                <th className="p-3 font-semibold">Queue</th>
                <th className="p-3 font-semibold">Schedule</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => {
                const onSite =
                  slot.onSiteCampaign ?? slot.liveCampaign ?? null;
                const upcoming =
                  slot.upcomingCampaign ?? slot.nextScheduledCampaign ?? null;
                const liveCount = slot.liveCount ?? (onSite ? 1 : 0);
                const scheduledCount = slot.scheduledCount ?? (upcoming ? 1 : 0);

                return (
                  <tr key={slot.slotKey} className="border-t border-gray-100">
                    <td className="p-3 align-middle">
                      <p className="font-medium text-gray-900">{slot.label}</p>
                      <code className="text-xs text-gray-500">
                        {slot.slotKey}
                      </code>
                    </td>
                    <td className="max-w-[200px] p-3 align-middle text-gray-600">
                      {slot.pages}
                    </td>
                    <td className="p-3 align-middle">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${slotStatusBadge(slot.slotStatus)}`}
                      >
                        {slotStatusLabel(slot.slotStatus)}
                      </span>
                    </td>
                    <td className="p-3 align-middle">
                      {onSite ? (
                        <div>
                          <p className="font-medium text-gray-900">
                            {onSite.businessName}
                          </p>
                          {!onSite.imageUrl ? (
                            <p className="text-xs text-amber-700">
                              No image — not visible
                            </p>
                          ) : onSite.visibleOnSite ? (
                            <p className="text-xs text-green-700">Visible</p>
                          ) : null}
                        </div>
                      ) : liveCount > 0 ? (
                        <p className="text-xs text-amber-700">
                          {liveCount} live but none visible (missing image)
                        </p>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-3 align-middle text-xs text-gray-600">
                      {liveCount > 0 || scheduledCount > 0 ? (
                        <div className="space-y-1">
                          {liveCount > 0 ? (
                            <p>
                              {liveCount} live
                              {liveCount > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('live')}
                                  className="ml-1 text-[#ff8400] underline"
                                >
                                  view
                                </button>
                              ) : null}
                            </p>
                          ) : null}
                          {scheduledCount > 0 ? (
                            <p>
                              {scheduledCount} scheduled
                              <button
                                type="button"
                                onClick={() => setActiveTab('scheduled')}
                                className="ml-1 text-[#ff8400] underline"
                              >
                                view
                              </button>
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 align-middle whitespace-nowrap text-gray-700">
                      {onSite ? (
                        <>
                          {formatShortDate(onSite.startDate)} –{' '}
                          {formatShortDate(onSite.endDate)}
                        </>
                      ) : upcoming ? (
                        <>
                          <span className="text-blue-700">Next: </span>
                          {formatShortDate(upcoming.startDate)} –{' '}
                          {formatShortDate(upcoming.endDate)}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}

      {activeTab === 'live' ? (
        <CampaignTable
          campaigns={campaignsByTab.live}
          emptyMessage="No campaigns are live on the site right now."
          onCancel={handleCancelCampaign}
          cancellingId={cancellingId}
        />
      ) : null}

      {activeTab === 'scheduled' ? (
        <CampaignTable
          campaigns={campaignsByTab.scheduled}
          emptyMessage="No scheduled campaigns."
          onCancel={handleCancelCampaign}
          cancellingId={cancellingId}
        />
      ) : null}

      {activeTab === 'ended' ? (
        <CampaignTable
          campaigns={campaignsByTab.ended}
          emptyMessage="No ended campaigns."
        />
      ) : null}

      {activeTab === 'all' ? (
        <CampaignTable
          campaigns={campaignsByTab.all}
          emptyMessage="No campaigns yet."
          onCancel={handleCancelCampaign}
          cancellingId={cancellingId}
        />
      ) : null}
    </div>
  );
}
