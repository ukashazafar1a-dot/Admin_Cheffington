import { redirect } from 'next/navigation';

export default function RestaurantReviewsRedirect() {
  redirect('/Admin/dashboard/reviews?tab=restaurant');
}
