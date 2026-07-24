export type OrgRole = "owner" | "admin" | "member" | "viewer"

export type Permission =
  | "project:read"
  | "project:write"
  | "secret:read"
  | "secret:write"
  | "secret:reveal"
  | "secret:delete"
  | "audit:read"
  | "org:manage"

const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  owner: [
    "project:read",
    "project:write",
    "secret:read",
    "secret:write",
    "secret:reveal",
    "secret:delete",
    "audit:read",
    "org:manage",
  ],
  admin: [
    "project:read",
    "project:write",
    "secret:read",
    "secret:write",
    "secret:reveal",
    "secret:delete",
    "audit:read",
  ],
  member: [
    "project:read",
    "secret:read",
    "secret:write",
    "secret:reveal",
  ],
  viewer: ["project:read", "secret:read"],
}

export function normalizeRole(role: string): OrgRole {
  if (role === "owner" || role === "admin" || role === "member" || role === "viewer") {
    return role
  }
  // Better Auth default roles may include custom strings; treat unknown as member
  if (role.includes("owner")) return "owner"
  if (role.includes("admin")) return "admin"
  return "member"
}

export function hasPermission(role: string, permission: Permission): boolean {
  const normalized = normalizeRole(role)
  return ROLE_PERMISSIONS[normalized].includes(permission)
}
