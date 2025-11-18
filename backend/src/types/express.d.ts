import { IUser } from '../models/User';

// Type helper for req.user - use this instead of direct req.user access
// This avoids conflicts with Passport's type declarations
export type AuthenticatedUser = IUser & { _id: string | any };

