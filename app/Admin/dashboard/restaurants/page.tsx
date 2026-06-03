import { RestaurantsDashboard } from '@/components/restaurants-dashboard';

export const metadata = {
  title: 'Restaurants - Cheffington Admin',
  description: 'Manage restaurants in the admin dashboard',
};

export default function RestaurantsPage() {
  return <RestaurantsDashboard />;
}
