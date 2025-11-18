import {
  sanitizeString,
  sanitizeEmail,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  sanitizeObject,
} from '../../../utils/validation';

describe('Validation Utilities', () => {
  describe('sanitizeString', () => {
    it('should sanitize XSS attempts', () => {
      const malicious = '<script>alert("xss")</script>';
      const sanitized = sanitizeString(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  test  ')).toBe('test');
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should normalize email addresses', () => {
      expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should validate strong passwords', () => {
      const result = isValidPassword('StrongPass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = isValidPassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require minimum length', () => {
      const result = isValidPassword('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should require uppercase letter', () => {
      const result = isValidPassword('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require lowercase letter', () => {
      const result = isValidPassword('UPPERCASE123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should require number', () => {
      const result = isValidPassword('NoNumbers!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should require special character', () => {
      const result = isValidPassword('NoSpecial123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('isValidUsername', () => {
    it('should validate correct usernames', () => {
      const result = isValidUsername('valid_username');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short usernames', () => {
      const result = isValidUsername('ab');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Username must be at least 3 characters long');
    });

    it('should reject long usernames', () => {
      const result = isValidUsername('a'.repeat(31));
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Username cannot exceed 30 characters');
    });

    it('should reject usernames with invalid characters', () => {
      const result = isValidUsername('invalid@username');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Username can only contain letters, numbers, underscores, and hyphens');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize nested objects', () => {
      const obj = {
        name: '<script>alert("xss")</script>',
        nested: {
          value: '  test  ',
        },
      };

      const sanitized = sanitizeObject(obj);
      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.nested.value).toBe('test');
    });

    it('should sanitize arrays', () => {
      const obj = {
        items: ['  item1  ', '<script>alert("xss")</script>'],
      };

      const sanitized = sanitizeObject(obj);
      expect(sanitized.items[0]).toBe('item1');
      expect(sanitized.items[1]).not.toContain('<script>');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject(undefined)).toBe(undefined);
    });
  });
});

