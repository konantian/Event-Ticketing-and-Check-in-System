import jwt from 'jsonwebtoken';

// JWT secret key - this should be moved to environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// JWT expiration time (20 minutes)
const JWT_EXPIRES_IN = '20m';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Sign a new JWT token
 * @param payload Data to be included in the token
 * @returns Signed JWT token
 */
export const signToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify and decode a JWT token
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Get token from Authorization header
 * @param authHeader Authorization header value
 * @returns Token string or null if not found
 */
export const getTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}; 