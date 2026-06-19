export type ChefApplicationStatus = 'pending' | 'approved' | 'rejected';
export type ApplicationType = 'chef' | 'business_owner';

export interface ChefApplication {
  _id?: string;
  id?: string;
  applicationType?: ApplicationType;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentRestaurant?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  jobTitle?: string;
  professionalEmail?: string;
  professionalProof?: string;
  applicationDocuments?: string[];
  signature?: string;
  status: ChefApplicationStatus;
  statusUpdatedAt?: string;
  adminNotes?: string;
  approvedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BannedPhrase {
  _id: string;
  phrase: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface FlaggedReviewRestaurant {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

export interface FlaggedReviewChef {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface FlaggedReview {
  _id: string;
  title?: string;
  comment: string;
  status: 'flagged';
  flaggedReason?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
  restaurant?: FlaggedReviewRestaurant;
  chef?: FlaggedReviewChef;
}

export interface AdminRestaurantReview {
  _id: string;
  title?: string;
  comment: string;
  status: 'published' | 'flagged';
  flaggedReason?: string;
  adminEditedAt?: string;
  createdAt: string;
  updatedAt?: string;
  chef?: FlaggedReviewChef;
}

export type RestaurantClaimStatus = 'pending' | 'approved' | 'rejected';

export interface RestaurantClaim {
  _id: string;
  restaurantId: {
    _id: string;
    name: string;
    city?: string;
    state?: string;
    country?: string;
    ownerId?: string;
  };
  claimantId?: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  relationshipToBusiness:
    | 'owner'
    | 'manager'
    | 'authorized_representative'
    | 'other';
  jobTitle?: string;
  proofSummary: string;
  proofDocumentUrls?: string[];
  status: RestaurantClaimStatus;
  adminNotes?: string;
  rejectionEmailMessage?: string;
  reviewedBy?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminRestaurant {
  _id: string;
  name: string;
  cuisine?: string;
  city?: string;
  state?: string;
  country?: string;
  status: 'draft' | 'published' | 'archived';
  updatedAt?: string;
  ownerId?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    applicationType?: 'chef' | 'business_owner';
    status?: 'pending' | 'approved' | 'rejected';
  };
  claimInfo?: {
    isClaimed: boolean;
    lastClaimStatus?: 'pending' | 'approved' | 'rejected' | null;
    lastClaimAt?: string | null;
  };
}

export interface AdminRestaurantDetail extends AdminRestaurant {
  recentClaims?: Array<{
    status: 'pending' | 'approved' | 'rejected';
    claimantName?: string;
    claimantEmail?: string;
    reviewedAt?: string;
    createdAt?: string;
  }>;
}

export type AdRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AdPlacement {
  key: string;
  name: string;
  priceLabel: string;
  pricePerDay: number;
  cells?: Record<string, string>;
}

export interface AdPricingColumn {
  id: string;
  label: string;
  order: number;
}

export interface AdPricingRow {
  id: string;
  slotKey: string;
  cells: Record<string, string>;
  pricePerDay: number;
  isActive: boolean;
  order: number;
}

export interface AdPricingTable {
  configId: string;
  columns: AdPricingColumn[];
  rows: AdPricingRow[];
  updatedAt?: string;
}

export interface AdCampaign {
  _id: string;
  placementKey: string;
  businessName: string;
  startDate: string;
  endDate: string;
  status: 'scheduled' | 'active' | 'expired' | 'cancelled';
}

export interface AdRequest {
  _id: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  placementKey: string;
  placement?: AdPlacement;
  days: number;
  duration?: string;
  adImageUrl?: string | null;
  needsDesign?: boolean;
  message?: string;
  status: AdRequestStatus;
  adminNotes?: string;
  rejectionEmailMessage?: string;
  reviewedBy?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  reviewedAt?: string;
  campaignId?: AdCampaign | string;
  createdAt?: string;
  updatedAt?: string;
}
