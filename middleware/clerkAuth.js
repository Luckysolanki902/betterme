import { getAuth } from '@clerk/nextjs/server';

export function getUserId(req) {
  const { userId } = getAuth(req);
  
  if (!userId) {
    throw new Error('Unauthorized - User not authenticated');
  }
  
  return userId;
}

export function getUserIdSafe(req) {
  try {
    const { userId } = getAuth(req);
    return userId;
  } catch (error) {
    return null;
  }
}
