import { getAuth } from '@clerk/nextjs/server';

export function getUserId(req) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      console.error('No userId found in Clerk auth');
      throw new Error('Unauthorized - User not authenticated');
    }
    
    console.log(`getUserId: Found userId ${userId}`);
    return userId;
  } catch (error) {
    console.error('Error in getUserId:', error);
    throw error;
  }
}

export function getUserIdSafe(req) {
  try {
    const { userId } = getAuth(req);
    console.log(`getUserIdSafe: userId = ${userId || 'null'}`);
    return userId;
  } catch (error) {
    console.error('Error in getUserIdSafe:', error);
    return null;
  }
}
