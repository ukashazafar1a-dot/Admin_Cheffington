'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ReviewModerationPanel from '@/components/review-moderation-panel';
import FlaggedReviewsPanel from '@/components/flagged-reviews-panel';
import RestaurantReviewsPanel from '@/components/restaurant-reviews-panel';

type ReviewsTab = 'moderation' | 'flagged' | 'restaurant';

function parseTab(value: string | null): ReviewsTab {
  if (value === 'flagged') return 'flagged';
  if (value === 'restaurant') return 'restaurant';
  return 'moderation';
}

export default function ReviewsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ReviewsTab>(() =>
    parseTab(searchParams.get('tab'))
  );

  useEffect(() => {
    setActiveTab(parseTab(searchParams.get('tab')));
  }, [searchParams]);

  const tabClass = (tab: ReviewsTab) =>
    `border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
      activeTab === tab
        ? 'border-[#ff8400] text-[#ff8400]'
        : 'border-transparent text-gray-600 hover:text-gray-900'
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Reviews</h1>
        <p className="mt-2 text-gray-600">
          Manage banned phrases, review flagged content, and browse restaurant reviews.
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('moderation')}
          className={tabClass('moderation')}
        >
          Review Moderation
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('flagged')}
          className={tabClass('flagged')}
        >
          Flagged Reviews
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('restaurant')}
          className={tabClass('restaurant')}
        >
          Restaurant Reviews
        </button>
      </div>

      {activeTab === 'moderation' ? <ReviewModerationPanel /> : null}
      {activeTab === 'flagged' ? <FlaggedReviewsPanel /> : null}
      {activeTab === 'restaurant' ? <RestaurantReviewsPanel /> : null}
    </div>
  );
}
