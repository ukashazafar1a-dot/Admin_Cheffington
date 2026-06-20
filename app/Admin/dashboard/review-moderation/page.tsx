import { redirect } from 'next/navigation';

export default function ReviewModerationRedirect() {
  redirect('/Admin/dashboard/reviews?tab=moderation');
}
