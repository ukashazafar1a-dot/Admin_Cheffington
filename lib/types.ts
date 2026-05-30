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
