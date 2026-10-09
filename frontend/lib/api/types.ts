export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  employee_id?: string;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// Enum options mirror the backend EnumResourceDto wire format
// ({ label, value }). The backend is the source of truth; no
// hardcoded enum values live on this side.
// Action links mirror the backend ActionLinkDto wire format
// ({ id, method, href, label }). The backend owns
// visibility and URLs; the frontend renders them generically.
export interface ActionLink {
  id: string;
  method: "PATCH" | "DELETE";
  href: string;
  label: string;
}

export interface EnumOption {
  label: string;
  value: string;
}
