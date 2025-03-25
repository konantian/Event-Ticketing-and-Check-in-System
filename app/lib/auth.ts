import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export function generateToken(userId: number, email: string, role: string) {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '24h' });
}

export async function verifyAuth(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return { authorized: false, error: 'No token provided' };
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number, email: string, role: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user) {
      return { authorized: false, error: 'User not found' };
    }
    
    return { authorized: true, user: { id: user.id, email: user.email, role: user.role } };
  } catch (error) {
    return { authorized: false, error: 'Invalid token' };
  }
}

export function isRole(user: any, roles: string[]) {
  return roles.includes(user.role);
}

export function unauthorized() {
  return NextResponse.json(
    { success: false, message: 'Unauthorized' },
    { status: 401 }
  );
}

export function forbidden() {
  return NextResponse.json(
    { success: false, message: 'Forbidden' },
    { status: 403 }
  );
} 