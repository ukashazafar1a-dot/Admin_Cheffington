import { redirect } from 'next/navigation';

export default function FlaggedReviewsRedirect() {
  redirect('/Admin/dashboard/reviews?tab=flagged');
}
