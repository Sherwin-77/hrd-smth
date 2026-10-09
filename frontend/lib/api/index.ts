// Barrel: `@/lib/api` keeps resolving here, so existing imports keep
// working. New code may import from the per-feature modules directly
// (`@/lib/api/employees`, `@/lib/api/auth`, ...).
export * from "./client";
export * from "./types";
export * from "./auth";
export * from "./employees";
export * from "./payrolls";
export * from "./payslips";
export * from "./contracts";
