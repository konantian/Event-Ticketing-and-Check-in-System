export const VALID_ROLES = ['Attendee', 'Organizer', 'Admin'] as const;
export type UserRole = typeof VALID_ROLES[number];

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.includes(role as UserRole);
} 