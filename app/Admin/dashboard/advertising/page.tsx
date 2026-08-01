'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { APIClient } from '@/lib/api-client';
import type { AdRequest } from '@/lib/types';
import { Card } from '@/components/ui/card';
import AdvertisingPricingEditor from '@/components/advertising-pricing-editor';
import AdvertisingTargetRegionsEditor from '@/components/advertising-target-regions-editor';
import LiveAdsPanel from '@/components/live-ads-panel';
import {
  getCampaignLiveLabel,
  getSlotDisplayInfo,
} from '@/lib/ad-slots';

type AdvertisingTab = 'requests' | 'pricing' | 'regions' | 'live';

type ToastItem = {
  id: number;
  type: 'success' | 'error';
  message: string;
};

const DURATION_LABELS: Record<string, string> = {
  '1_week': '7 days',
  '2_weeks': '14 days',
  '1_month': '30 days',
};

function requestDayCount(request: AdRequest) {
  if (typeof request.days === 'number' && request.days > 0) {
    return request.days;
  }
  if (request.duration === '1_week') return 7;
  if (request.duration === '2_weeks') return 14;
  if (request.duration === '1_month') return 30;
  return 7;
}

function formatRequestDays(request: AdRequest) {
  if (request.billingMode === 'subscription') {
    return 'Monthly billing cycle';
  }
  if (typeof request.days === 'number' && request.days > 0) {
    return `${request.days} ${request.days === 1 ? 'day' : 'days'}`;
  }
  if (request.duration) {
    return DURATION_LABELS[request.duration] || request.duration;
  }
  return '-';
}

function getRequestPricePerDay(request: AdRequest) {
  const fromPlacement = Number(request.placement?.pricePerDay);
  if (Number.isFinite(fromPlacement) && fromPlacement > 0) return fromPlacement;

  const label = request.placement?.priceLabel || '';
  const perDayMatch = label.match(/\$?\s*([\d.]+)\s*\/?\s*day/i);
  if (perDayMatch) return Number(perDayMatch[1]) || 0;

  const moneyMatch = label.match(/\$?\s*([\d.]+)/);
  if (moneyMatch) return Number(moneyMatch[1]) || 0;

  return 0;
}

function estimateRequestTotal(request: AdRequest) {
  const amountDue = Number(request.amountDue);
  if (Number.isFinite(amountDue) && amountDue > 0) {
    return amountDue;
  }
  if (request.billingMode === 'subscription') {
    return null;
  }
  const days = requestDayCount(request);
  const pricePerDay = getRequestPricePerDay(request);
  if (pricePerDay <= 0 || days <= 0) return null;
  return Math.round(pricePerDay * days * 100) / 100;
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function formatRequestTotal(request: AdRequest) {
  const total = estimateRequestTotal(request);
  const currency = (request.currency || 'aud').toUpperCase();
  if (request.billingMode === 'subscription') {
    return total == null
      ? 'Monthly plan'
      : `${currency} $${formatMoney(total)}/month`;
  }
  if (total == null) return request.placement?.priceLabel || null;
  return `${currency} $${formatMoney(total)}`;
}

function formatRequestPriceSummary(request: AdRequest) {
  const total = estimateRequestTotal(request);
  const currency = (request.currency || 'aud').toUpperCase();
  if (request.billingMode === 'subscription') {
    return total == null
      ? 'Monthly plan (auto-renews)'
      : `${currency} $${formatMoney(total)}/month (auto-renews)`;
  }
  const days = requestDayCount(request);
  const pricePerDay = getRequestPricePerDay(request);
  if (total == null) return request.placement?.priceLabel || null;
  return `${currency} $${formatMoney(total)} ($${formatMoney(pricePerDay)}/day × ${days} ${
    days === 1 ? 'day' : 'days'
  })`;
}

function defaultEndDateFromDays(days: number) {
  const end = new Date();
  end.setDate(end.getDate() + Math.max(1, days));
  return end.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function formatShortDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
}

function statusBadgeClass(status: AdRequest['status']) {
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
  if (status === 'approved') return 'bg-green-100 text-green-800';
  return 'bg-red-100 text-red-800';
}

function paymentBadgeClass(paymentStatus?: AdRequest['paymentStatus']) {
  if (paymentStatus === 'paid') return 'bg-emerald-100 text-emerald-800';
  if (paymentStatus === 'refunded') return 'bg-blue-100 text-blue-800';
  if (paymentStatus === 'failed') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
}

function formatPaymentStatus(paymentStatus?: AdRequest['paymentStatus']) {
  if (!paymentStatus || paymentStatus === 'unpaid') return 'Unpaid';
  return paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1);
}

function formatPaidAmount(request: AdRequest) {
  if (request.amountPaid == null) return null;
  const currency = (request.currency || 'aud').toUpperCase();
  return `${currency} $${formatMoney(request.amountPaid)}`;
}

function isFreeCouponRequest(request: AdRequest) {
  return (
    request.paymentStatus === 'paid' &&
    Number(request.amountPaid) === 0 &&
    Boolean(request.promoCodeApplied)
  );
}

function freeCouponLabel(request: AdRequest) {
  return request.billingMode === 'subscription'
    ? 'Free coupon · first month free'
    : 'Free coupon applied';
}

export default function AdvertisingPage() {
  const [activeTab, setActiveTab] = useState<AdvertisingTab>('requests');
  const [requests, setRequests] = useState<AdRequest[]>([]);
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
  const [startDateById, setStartDateById] = useState<Record<string, string>>({});
  const [endDateById, setEndDateById] = useState<Record<string, string>>({});
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [actionId, setActionId] = useState<string | null>(null);
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

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const [listResponse, pendingResponse, approvedResponse, rejectedResponse] =
        await Promise.all([
          APIClient.getAdRequests({
            status: statusFilter === 'all' ? undefined : statusFilter,
            limit: 100,
          }),
          APIClient.getAdRequests({ status: 'pending', limit: 1 }),
          APIClient.getAdRequests({ status: 'approved', limit: 1 }),
          APIClient.getAdRequests({ status: 'rejected', limit: 1 }),
        ]);

      if (listResponse.success) {
        const items = (listResponse.data || []) as AdRequest[];
        setRequests(items);
        setStartDateById((prev) => {
          const next = { ...prev };
          for (const item of items) {
            if (!next[item._id]) next[item._id] = todayIso();
          }
          return next;
        });
        setEndDateById((prev) => {
          const next = { ...prev };
          for (const item of items) {
            if (!next[item._id]) {
              const days = requestDayCount(item);
              next[item._id] = defaultEndDateFromDays(days);
            }
          }
          return next;
        });
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
          : 'Failed to fetch advertising requests'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'requests') {
      loadRequests();
    }
  }, [statusFilter, activeTab]);

  const reviewRequest = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const rejectionEmailMessage = rejectionEmailById[id]?.trim();
      if (status === 'rejected' && !rejectionEmailMessage) {
        const msg = 'Add a rejection message in More details before rejecting.';
        setError(msg);
        pushToast('error', msg);
        setExpandedIds((prev) => ({ ...prev, [id]: true }));
        return;
      }

      const startDate = startDateById[id];
      const endDate = endDateById[id];
      if (status === 'approved' && (!startDate || !endDate)) {
        const msg = 'Set start and end dates in More details before approving.';
        setError(msg);
        pushToast('error', msg);
        setExpandedIds((prev) => ({ ...prev, [id]: true }));
        return;
      }

      const request = requests.find((item) => item._id === id);
      if (status === 'approved' && request?.paymentStatus !== 'paid') {
        const msg =
          'This request has not been paid yet. Approval is only available after payment.';
        setError(msg);
        pushToast('error', msg);
        setExpandedIds((prev) => ({ ...prev, [id]: true }));
        return;
      }

      setActionId(id);
      const response = await APIClient.updateAdRequestStatus(id, status, {
        adminNotes: notesById[id] || undefined,
        rejectionEmailMessage: rejectionEmailMessage || undefined,
        startDate: status === 'approved' ? startDate : undefined,
        endDate: status === 'approved' ? endDate : undefined,
      });

      setError('');
      setExpandedIds((prev) => ({ ...prev, [id]: false }));
      pushToast('success', response.message || 'Ad request updated successfully');
      await loadRequests();
    } catch (updateError) {
      const msg =
        updateError instanceof Error
          ? updateError.message
          : 'Failed to update ad request';
      setError(msg);
      pushToast('error', msg);
    } finally {
      setActionId(null);
    }
  };

  if (loading && activeTab === 'requests') {
    return <p className="text-neutral-800">Loading advertising requests...</p>;
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
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Advertising</h1>
          <p className="mt-2 text-gray-600">
            Manage pricing, review ad requests, and monitor live ads on the site.
          </p>
        </div>
        {activeTab === 'requests' ? (
          <select
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
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
        ) : null}
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'requests'
              ? 'border-[#ff8400] text-[#ff8400]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Requests
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('live')}
          className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'live'
              ? 'border-[#ff8400] text-[#ff8400]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Live ads
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'pricing'
              ? 'border-[#ff8400] text-[#ff8400]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Pricing table
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('regions')}
          className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'regions'
              ? 'border-[#ff8400] text-[#ff8400]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Target areas
        </button>
      </div>

      {activeTab === 'pricing' ? (
        <AdvertisingPricingEditor />
      ) : activeTab === 'regions' ? (
        <AdvertisingTargetRegionsEditor />
      ) : activeTab === 'live' ? (
        <LiveAdsPanel />
      ) : (
        <>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className="text-left"
          >
            <Card
              className={`p-4 ${
                statusFilter === filter ? 'ring-2 ring-[#ff8400]' : ''
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {filter === 'all' ? 'Total' : filter}
              </p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  filter === 'pending'
                    ? 'text-yellow-600'
                    : filter === 'approved'
                      ? 'text-green-600'
                      : filter === 'rejected'
                        ? 'text-red-600'
                        : 'text-gray-900'
                }`}
              >
                {filter === 'all'
                  ? stats.total
                  : filter === 'pending'
                    ? stats.pending
                    : filter === 'approved'
                      ? stats.approved
                      : stats.rejected}
              </p>
            </Card>
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!requests.length ? (
        <Card className="p-8 text-center text-gray-600">
          No advertising requests found.
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const isExpanded = Boolean(expandedIds[request._id]);
            const isPending = request.status === 'pending';
            const isPaid = request.paymentStatus === 'paid';
            const isFreeCoupon = isFreeCouponRequest(request);
            const isBusy = actionId === request._id;
            const placementLabel =
              request.placement?.name || request.placementKey.replace(/_/g, ' ');
            const requestTotal = formatRequestTotal(request);
            const slotInfo = getSlotDisplayInfo(request.placementKey);

            return (
              <Card key={request._id} className="overflow-hidden">
                <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {request.businessName}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(request.status)}`}
                      >
                        {request.status}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentBadgeClass(request.paymentStatus)}`}
                      >
                        {formatPaymentStatus(request.paymentStatus)}
                      </span>
                      {isFreeCoupon ? (
                        <span className="rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {freeCouponLabel(request)}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span>
                        <span className="font-medium text-gray-800">Placement:</span>{' '}
                        {placementLabel}
                      </span>
                      <span>
                        <span className="font-medium text-gray-800">Target:</span>{' '}
                        {request.targetRegionLabel ||
                          request.targetRegionKey ||
                          'Site-wide (legacy)'}
                      </span>
                      <span>
                        <span className="font-medium text-gray-800">Days:</span>{' '}
                        {formatRequestDays(request)}
                      </span>
                      {requestTotal ? (
                        <span>
                          <span className="font-medium text-gray-800">Total:</span>{' '}
                          {requestTotal}
                        </span>
                      ) : null}
                      {formatPaidAmount(request) ? (
                        <span>
                          <span className="font-medium text-gray-800">Paid:</span>{' '}
                          {formatPaidAmount(request)}
                        </span>
                      ) : null}
                      {isFreeCoupon ? (
                        <span>
                          <span className="font-medium text-gray-800">Promo:</span>{' '}
                          {request.promoCodeApplied}
                          {request.billingMode === 'subscription'
                            ? ' · one month free advertising'
                            : ' · no charge'}
                        </span>
                      ) : null}
                      <span>
                        <span className="font-medium text-gray-800">Contact:</span>{' '}
                        {request.contactName}
                      </span>
                      <span className="truncate">{request.contactEmail}</span>
                    </div>

                    <p className="text-xs text-gray-500">
                      Submitted {formatShortDate(request.createdAt)}
                      {requestTotal ? ` · ${requestTotal}` : ''}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(request._id)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={16} />
                          Hide details
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} />
                          More details
                        </>
                      )}
                    </button>

                    {isPending ? (
                      <>
                        <button
                          type="button"
                          disabled={isBusy || !isPaid}
                          onClick={() => reviewRequest(request._id, 'approved')}
                          className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                          title={
                            isPaid
                              ? 'Approve this paid ad request'
                              : 'Payment required before approval'
                          }
                        >
                          {isBusy ? 'Saving…' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => reviewRequest(request._id, 'rejected')}
                          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {isExpanded ? (
                  <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 text-sm">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Contact
                        </h3>
                        <p>
                          <span className="text-gray-500">Name:</span>{' '}
                          {request.contactName}
                        </p>
                        <p>
                          <span className="text-gray-500">Email:</span>{' '}
                          {request.contactEmail}
                        </p>
                        <p>
                          <span className="text-gray-500">Phone:</span>{' '}
                          {request.contactPhone}
                        </p>
                        <p className="break-all">
                          <span className="text-gray-500">Website:</span>{' '}
                          <a
                            href={request.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#ff8400] underline"
                          >
                            {request.websiteUrl}
                          </a>
                        </p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Request
                        </h3>
                        <p>
                          <span className="text-gray-500">Placement:</span>{' '}
                          {placementLabel}
                        </p>
                        <p>
                          <span className="text-gray-500">Target area:</span>{' '}
                          {request.targetRegionLabel ||
                            request.targetRegionKey ||
                            'Site-wide (legacy)'}
                        </p>
                        <p>
                          <span className="text-gray-500">Slot key:</span>{' '}
                          <code className="text-xs">{request.placementKey}</code>
                          {slotInfo.canonical !== request.placementKey ? (
                            <span className="text-xs text-gray-500">
                              {' '}
                              → maps to <code>{slotInfo.canonical}</code>
                            </span>
                          ) : null}
                        </p>
                        {slotInfo.isKnown ? (
                          <p className="text-green-700">
                            <span className="text-gray-500">Shows on:</span>{' '}
                            {slotInfo.pages}
                          </p>
                        ) : (
                          <p className="text-red-700">
                            Unknown slot key — ad will not appear until you fix the
                            pricing table slot key (use restaurant_sidebar,
                            homepage_featured, etc.).
                          </p>
                        )}
                        <p>
                          <span className="text-gray-500">Days:</span>{' '}
                          {formatRequestDays(request)}
                        </p>
                        {formatRequestPriceSummary(request) ? (
                          <p>
                            <span className="text-gray-500">Estimated total:</span>{' '}
                            {formatRequestPriceSummary(request)}
                          </p>
                        ) : null}
                        <p>
                          <span className="text-gray-500">Payment:</span>{' '}
                          {formatPaymentStatus(request.paymentStatus)}
                          {formatPaidAmount(request)
                            ? ` · ${formatPaidAmount(request)}`
                            : ''}
                        </p>
                        {isFreeCoupon ? (
                          <p>
                            <span className="text-gray-500">Promo:</span>{' '}
                            {request.promoCodeApplied}
                            {request.billingMode === 'subscription'
                              ? ' — first month of advertising is free'
                              : ' — checkout total was fully discounted'}
                          </p>
                        ) : null}
                        {request.needsDesign ? (
                          <p className="text-orange-700">
                            Client requested creative design from Cheffington
                          </p>
                        ) : null}
                        {request.message ? (
                          <p>
                            <span className="text-gray-500">Message:</span>{' '}
                            {request.message}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {request.adImageUrl ? (
                      <div className="mt-4">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Ad creative
                        </h3>
                        <a
                          href={request.adImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={request.adImageUrl}
                            alt="Ad creative"
                            className="max-h-36 rounded-md border border-gray-200 bg-white object-contain"
                          />
                        </a>
                      </div>
                    ) : null}

                    {isPending ? (
                      <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Review actions
                        </h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              Start date
                            </label>
                            <input
                              type="date"
                              value={startDateById[request._id] || ''}
                              onChange={(e) =>
                                setStartDateById((prev) => ({
                                  ...prev,
                                  [request._id]: e.target.value,
                                }))
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              End date
                            </label>
                            <input
                              type="date"
                              value={endDateById[request._id] || ''}
                              onChange={(e) =>
                                setEndDateById((prev) => ({
                                  ...prev,
                                  [request._id]: e.target.value,
                                }))
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <textarea
                          value={notesById[request._id] || ''}
                          onChange={(e) =>
                            setNotesById((prev) => ({
                              ...prev,
                              [request._id]: e.target.value,
                            }))
                          }
                          placeholder="Admin notes (optional)"
                          className="min-h-16 w-full rounded-md border border-gray-300 p-2 text-sm"
                        />
                        <textarea
                          value={rejectionEmailById[request._id] || ''}
                          onChange={(e) =>
                            setRejectionEmailById((prev) => ({
                              ...prev,
                              [request._id]: e.target.value,
                            }))
                          }
                          placeholder="Rejection email message (required if you reject). Paid requests are refunded automatically."
                          className="min-h-16 w-full rounded-md border border-gray-300 p-2 text-sm"
                        />
                        {!isPaid ? (
                          <p className="text-sm text-amber-700">
                            Waiting for payment — Approve is disabled until the customer
                            completes Stripe checkout.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
                        <h3 className="mb-2 text-sm font-semibold text-gray-900">
                          Review history
                        </h3>
                        <p>
                          <span className="text-gray-500">Reviewed:</span>{' '}
                          {formatDateTime(request.reviewedAt)}
                        </p>
                        <p>
                          <span className="text-gray-500">By:</span>{' '}
                          {request.reviewedBy?.name ||
                            request.reviewedBy?.email ||
                            '-'}
                        </p>
                        {request.adminNotes ? (
                          <p className="mt-1">
                            <span className="text-gray-500">Notes:</span>{' '}
                            {request.adminNotes}
                          </p>
                        ) : null}
                        {request.status === 'approved' &&
                        request.campaignId &&
                        typeof request.campaignId === 'object' ? (
                          <>
                            <p className="mt-1">
                              <span className="text-gray-500">Scheduled:</span>{' '}
                              {formatShortDate(request.campaignId.startDate)} –{' '}
                              {formatShortDate(request.campaignId.endDate)}
                            </p>
                            <p className="mt-1 font-medium text-[#ff8400]">
                              {getCampaignLiveLabel(
                                request.campaignId.startDate,
                                request.campaignId.endDate
                              ) || request.campaignId.status}
                            </p>
                          </>
                        ) : null}
                        {request.status === 'rejected' && request.rejectionEmailMessage ? (
                          <p className="mt-1">
                            <span className="text-gray-500">Rejection message:</span>{' '}
                            {request.rejectionEmailMessage}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}
