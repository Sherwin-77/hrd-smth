export interface NavItem {
  id: string;
  label: string;
  href: string;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/dashboard",
    description: "Your profile and payroll summary",
  },
  {
    id: "employees",
    label: "Employees",
    href: "/dashboard/employees",
    description: "Search and browse employees",
  },
  {
    id: "payrolls",
    label: "Payrolls",
    href: "/dashboard/payrolls",
    description: "Bank accounts and tax settings",
  },
  {
    id: "payslips",
    label: "Payslips",
    href: "/dashboard/payslips",
    description: "Salary slips by period",
  },
  {
    id: "sessions",
    label: "Sessions",
    href: "/dashboard/sessions",
    description: "Devices signed in to your account",
  },
  {
    id: "account",
    label: "Account",
    href: "/dashboard/account",
    description: "Profile details and password",
  },
];

const COLLAPSED_KEY = "hr.sidebar.collapsed";

export function loadCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(COLLAPSED_KEY) === "1";
}

export function saveCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
}
