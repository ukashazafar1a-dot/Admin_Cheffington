export type StatusFilter =
  | 'all'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'disabled';
export type TypeFilter = 'all' | 'chef' | 'business_owner' | 'public';

export function buildApplicationQueryFilters(filters: {
  search?: string;
  status?: StatusFilter;
  type?: TypeFilter;
}) {
  return {
    status: filters.status && filters.status !== 'all' ? filters.status : undefined,
    search: filters.search?.trim() || undefined,
    applicationType:
      filters.type && filters.type !== 'all' ? filters.type : undefined,
  };
}
