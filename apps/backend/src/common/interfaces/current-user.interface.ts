/**
 * Typed representation of the user object attached to the request
 * by JwtAuthGuard after decoding the JWT and fetching from the database.
 */
export interface CurrentUserPayload {
  /** The user's unique ID (cuid) */
  id: string;
  /** The user's email address */
  email: string;
  /** The user's first name */
  firstName: string;
  /** The user's last name */
  lastName: string;
  /** The user's role within the tenant (OWNER, MANAGER, STAFF) */
  role: string;
  /** The tenant this user belongs to */
  tenantId: string;
  /** Whether the user account is active */
  isActive: boolean;
}
