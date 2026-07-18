export const KNOWN_AD_SLOTS = {
  header_banner: {
    label: 'Header banner',
    pages: 'Every page — below the navigation bar',
    recommendedSize: '728×90',
  },
  footer_banner: {
    label: 'Footer banner',
    pages: 'Every page — above the site footer',
    recommendedSize: '728×90',
  },
  homepage_featured: {
    label: 'Homepage featured banner',
    pages: 'Homepage — below the hero',
    recommendedSize: '970×250',
  },
  restaurant_sidebar: {
    label: 'Restaurant page sidebar',
    pages: 'Restaurant detail pages (/restaurants/[id]) — left column',
    recommendedSize: '300×600',
  },
  restaurant_top: {
    label: 'Restaurant page top banner',
    pages: 'Restaurant detail pages (/restaurants/[id]) — below hero',
    recommendedSize: '728×90',
  },
  restaurant_right_rail: {
    label: 'Restaurant page right rail',
    pages: 'Restaurant detail pages (/restaurants/[id]) — top of main column',
    recommendedSize: '300×250',
  },
  restaurant_reviews_top: {
    label: 'Restaurant page reviews banner',
    pages: 'Restaurant detail pages (/restaurants/[id]) — above chef reviews',
    recommendedSize: '728×90',
  },
  chef_sidebar: {
    label: 'Chef profile sidebar',
    pages: 'Chef profile page',
    recommendedSize: '300×250',
  },
  restaurants_top: {
    label: 'Restaurants top banner',
    pages: 'Restaurants directory — below search filters',
    recommendedSize: '728×90',
  },
  restaurants_list: {
    label: 'Restaurants list inline',
    pages: 'Restaurants directory — between listing cards',
    recommendedSize: '300×250',
  },
  about_banner: {
    label: 'About page banner',
    pages: 'About page — mid-page',
    recommendedSize: '728×90',
  },
} as const;

const AD_SLOT_ALIASES: Record<string, keyof typeof KNOWN_AD_SLOTS> = {
  restaurant_sidebar1: 'restaurant_sidebar',
  restaurant_page_sidebar: 'restaurant_sidebar',
  restaurant_page_sidebar1: 'restaurant_sidebar',
  restaurant_page_top: 'restaurant_top',
  restaurant_top_banner: 'restaurant_top',
  restaurant_page_right: 'restaurant_right_rail',
  restaurant_page_right_bar: 'restaurant_right_rail',
  restaurant_right_bar: 'restaurant_right_rail',
  restaurant_page_reviews: 'restaurant_reviews_top',
  restaurant_reviews_banner: 'restaurant_reviews_top',
  homepage: 'homepage_featured',
  homepage_featured_spot: 'homepage_featured',
  chef_sidebar1: 'chef_sidebar',
  chef_page_sidebar: 'chef_sidebar',
  restaurants_list_inline: 'restaurants_list',
  header: 'header_banner',
  top_banner: 'header_banner',
  footer: 'footer_banner',
  about: 'about_banner',
  restaurants_top_banner: 'restaurants_top',
};

export function resolveAdSlotKey(slot: string) {
  const key = slot.trim();
  return AD_SLOT_ALIASES[key] || key;
}

export function getSlotDisplayInfo(slot: string) {
  const canonical = resolveAdSlotKey(slot);
  const info = KNOWN_AD_SLOTS[canonical as keyof typeof KNOWN_AD_SLOTS];
  return {
    canonical,
    ...info,
    isKnown: Boolean(info),
  };
}

export function getCampaignLiveLabel(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return null;

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  if (now < start) {
    return `Scheduled — goes live ${start.toLocaleDateString()}`;
  }
  if (now > end) {
    return 'Ended — no longer on site';
  }
  return 'Live on site now';
}

export const SITE_AD_SLOT_KEYS = Object.keys(KNOWN_AD_SLOTS);
