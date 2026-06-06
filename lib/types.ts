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
