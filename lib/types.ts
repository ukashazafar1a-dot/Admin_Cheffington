export type ChefApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface ChefApplication {
  _id?: string;
  id?: string;
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentRestaurant: string;
  // Address
  address1: string;
  address2?: string;
  city: string;
  state: string;
  // Professional Details
  jobTitle: string;
  yearsOfExperience: number;
  cuisineSpecialties: string[];
  // Restaurant Information
  restaurantName: string;
  restaurantAddress?: string;
  restaurantWebsite?: string;
  // Documents
  professionalProof: string;
  signature: string;
  // Status
  status: ChefApplicationStatus;
  statusUpdatedAt?: string;
  adminNotes?: string;
  approvedBy?: string;
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}
