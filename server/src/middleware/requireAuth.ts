import type { RequestHandler } from 'express';
import type { User } from '../generated/prisma/client.js';
import { ApiError } from '../lib/errors.js';

declare global {
  namespace Express {
    interface Locals {
      currentUser: User;
    }
  }
}

export type Identity = { clerkUserId: string; name: string; email: string; avatarUrl?: string };
export type AuthDependencies = {
  getSubject: (req: Parameters<RequestHandler>[0]) => string | null;
  loadIdentity: (clerkUserId: string) => Promise<Identity>;
  syncUser: (identity: Identity) => Promise<User>;
};

export function createRequireAuth(deps: AuthDependencies): RequestHandler {
  return async (req, res, next) => {
    const clerkUserId = deps.getSubject(req);
    if (!clerkUserId) throw new ApiError(401, 'UNAUTHENTICATED', 'Bitte melde dich an.');
    res.locals.currentUser = await deps.syncUser(await deps.loadIdentity(clerkUserId));
    next();
  };
}

// Compare local User IDs, never Clerk IDs, after loading an item in its service.
export function requireOwner(ownerId: string, currentUserId: string) {
  if (ownerId !== currentUserId)
    throw new ApiError(403, 'FORBIDDEN', 'Du darfst diese Anzeige nicht ändern.');
}

export function requireModerator(user: User) {
  if (user.role !== 'MODERATOR' && user.role !== 'ADMIN')
    throw new ApiError(403, 'FORBIDDEN', 'Diese Aktion ist nur für Moderatoren erlaubt.');
}
