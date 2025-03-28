import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

const JWT_EXPIRES_IN = '20m';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const signToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const getTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}; 