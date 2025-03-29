import { describe, expect, it } from '@jest/globals';
import {
  sanitizeEmail,
  isValidEmail,
  isValidPassword,
  isValidRole,
  VALID_ROLES,
  UserRole
} from '../../app/lib/validation';

describe('Validation Functions', () => {
  describe('sanitizeEmail', () => {
    it('should trim whitespace from email', () => {
      const email = '  test@example.com  ';
      expect(sanitizeEmail(email)).toBe('test@example.com');
    });

    it('should convert email to lowercase', () => {
      const email = 'TEST@EXAMPLE.COM';
      expect(sanitizeEmail(email)).toBe('test@example.com');
    });

    it('should handle email with no whitespace or uppercase', () => {
      const email = 'test@example.com';
      expect(sanitizeEmail(email)).toBe('test@example.com');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.com',
        'user+label@domain.co.uk'
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@.com',
        'user@domain.',
        'user space@domain.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('isValidPassword', () => {
    it('should validate passwords with 8 or more characters', () => {
      const validPasswords = [
        'password123',
        '12345678',
        'longpassword123!@#'
      ];

      validPasswords.forEach(password => {
        expect(isValidPassword(password)).toBe(true);
      });
    });

    it('should reject passwords with less than 8 characters', () => {
      const invalidPasswords = [
        '123',
        'short',
        '1234567',
        ''
      ];

      invalidPasswords.forEach(password => {
        expect(isValidPassword(password)).toBe(false);
      });
    });
  });

  describe('isValidRole', () => {
    it('should validate correct roles', () => {
      VALID_ROLES.forEach(role => {
        expect(isValidRole(role)).toBe(true);
      });
    });

    it('should reject invalid roles', () => {
      const invalidRoles = [
        'User',
        'Guest',
        'SuperAdmin',
        '',
        'admin', // case sensitive
        'ADMIN'
      ];

      invalidRoles.forEach(role => {
        expect(isValidRole(role)).toBe(false);
      });
    });

    it('should properly type guard valid roles', () => {
      const role = 'Attendee';
      if (isValidRole(role)) {
        // TypeScript should recognize role as UserRole type
        const typedRole: UserRole = role;
        expect(typedRole).toBe('Attendee');
      }
    });
  });
}); 