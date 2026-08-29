'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APIClient } from '@/lib/api-client';
import HomepageCopyEditor from '@/components/homepage-copy-editor';

type DashboardData = {
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    disabled: number;
  };
  restaurants: { total: number; published: number; draft: number; archived: number };
  claims: { total: number; pending: number; approved: number; rejected: number };
  reviews: { published: number; flagged: number; removed: number; total: number };
  flaggedPending: number;
  bannedPhrases: number;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<DashboardData>({
    applications: { total: 0, pending: 0, approved: 0, rejected: 0, disabled: 0 },
    restaurants: { total: 0, published: 0, draft: 0, archived: 0 },
    claims: { total: 0, pending: 0, approved: 0, rejected: 0 },
    reviews: { published: 0, flagged: 0, removed: 0, total: 0 },
    flaggedPending: 0,
    bannedPhrases: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [
          appStatsRes,
          restaurantRes,
          claimPendingRes,
          claimApprovedRes,
          claimRejectedRes,
          moderationOverviewRes,
        ] = await Promise.all([
          APIClient.getDashboardStats(),
          APIClient.getAdminRestaurants({ limit: 1 }),
          APIClient.getRestaurantClaims({ status: 'pending', limit: 1 }),
          APIClient.getRestaurantClaims({ status: 'approved', limit: 1 }),
          APIClient.getRestaurantClaims({ status: 'rejected', limit: 1 }),
          APIClient.getReviewModerationOverview(),
        ]);

        const pending = claimPendingRes.count ?? 0;
        const approved = claimApprovedRes.count ?? 0;
        const rejected = claimRejectedRes.count ?? 0;
        const moderation = moderationOverviewRes?.data;

        setData({
          applications: {
            total: appStatsRes?.data?.total ?? 0,
            pending: appStatsRes?.data?.pending ?? 0,
            approved: appStatsRes?.data?.approved ?? 0,
            rejected: appStatsRes?.data?.rejected ?? 0,
            disabled: appStatsRes?.data?.disabled ?? 0,
          },
          restaurants: {
            total: restaurantRes?.stats?.total ?? 0,
            published: restaurantRes?.stats?.published ?? 0,
            draft: restaurantRes?.stats?.draft ?? 0,
            archived: restaurantRes?.stats?.archived ?? 0,
          },
          claims: {
            total: pending + approved + rejected,
            pending,
            approved,
            rejected,
          },
          reviews: {
            published: moderation?.reviews?.published ?? 0,
            flagged: moderation?.reviews?.flagged ?? 0,
            removed: moderation?.reviews?.removed ?? 0,
            total: moderation?.reviews?.total ?? 0,
          },
          flaggedPending: moderation?.flaggedPending ?? 0,
          bannedPhrases: moderation?.bannedPhrases ?? 0,
        });
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load dashboard data'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <p className="text-neutral-800">Loading dashboard data...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">Live overview from real backend data.</p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{data.applications.total}</div>
            <p className="mt-1 text-xs text-slate-500">
              Pending {data.applications.pending} • Approved {data.applications.approved} •
              Rejected {data.applications.rejected} • Removed {data.applications.disabled}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Restaurants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{data.restaurants.total}</div>
            <p className="mt-1 text-xs text-slate-500">
              Published {data.restaurants.published} • Draft {data.restaurants.draft} •
              Archived {data.restaurants.archived}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Restaurant Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{data.claims.total}</div>
            <p className="mt-1 text-xs text-slate-500">
              Pending {data.claims.pending} • Approved {data.claims.approved} •
              Rejected {data.claims.rejected}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Restaurant Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{data.reviews.total}</div>
            <p className="mt-1 text-xs text-slate-500">
              Published {data.reviews.published} • Flagged {data.reviews.flagged} •
              Removed {data.reviews.removed}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Flagged Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{data.flaggedPending}</div>
            <p className="mt-1 text-xs text-slate-500">
              Awaiting admin approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Review Moderation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{data.bannedPhrases}</div>
            <p className="mt-1 text-xs text-slate-500">
              Banned words and phrases
            </p>
          </CardContent>
        </Card>
      </div>

      <HomepageCopyEditor />
    </div>
  );
}
