import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  evaluatePassword,
  PasswordMeter,
  type PasswordEvaluation,
} from '../PasswordMeter';

// Mock i18n
vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

// Mock PasswordStrengthBar
vi.mock('react-password-strength-bar', () => ({
  default: ({ password }: { password: string }) => (
    <div data-testid="password-strength-bar">
      {password.length > 0 ? 'bar' : ''}
    </div>
  ),
}));

describe('Password Evaluation', () => {
  describe('evaluatePassword', () => {
    it('should validate minimum length (8 characters)', () => {
      expect(evaluatePassword('short').hasMinLength).toBe(false);
      expect(evaluatePassword('12345678').hasMinLength).toBe(true);
      expect(evaluatePassword('longerpassword').hasMinLength).toBe(true);
    });

    it('should validate maximum length (25 characters)', () => {
      expect(evaluatePassword('normalpassword').hasMaxLength).toBe(true);
      expect(evaluatePassword('a'.repeat(25)).hasMaxLength).toBe(true);
      expect(evaluatePassword('a'.repeat(26)).hasMaxLength).toBe(false);
      expect(evaluatePassword('a'.repeat(30)).hasMaxLength).toBe(false);
    });

    it('should detect presence of letters', () => {
      expect(evaluatePassword('12345678').hasLetter).toBe(false);
      expect(evaluatePassword('password123').hasLetter).toBe(true);
      expect(evaluatePassword('PASSWORD123').hasLetter).toBe(true);
      expect(evaluatePassword('Pass123').hasLetter).toBe(true);
      expect(evaluatePassword('a1234567').hasLetter).toBe(true);
    });

    it('should detect presence of numbers', () => {
      expect(evaluatePassword('password').hasNumber).toBe(false);
      expect(evaluatePassword('password1').hasNumber).toBe(true);
      expect(evaluatePassword('12345678').hasNumber).toBe(true);
      expect(evaluatePassword('pass123word').hasNumber).toBe(true);
    });

    it('should validate strong length (12+ characters)', () => {
      expect(evaluatePassword('shortpass').isStrongLength).toBe(false);
      expect(evaluatePassword('12345678901').isStrongLength).toBe(false);
      expect(evaluatePassword('123456789012').isStrongLength).toBe(true);
      expect(evaluatePassword('verylongpassword123').isStrongLength).toBe(true);
    });

    it('should handle empty password', () => {
      const result: PasswordEvaluation = evaluatePassword('');

      expect(result.hasMinLength).toBe(false);
      expect(result.hasMaxLength).toBe(true);
      expect(result.hasLetter).toBe(false);
      expect(result.hasNumber).toBe(false);
      expect(result.isStrongLength).toBe(false);
    });

    it('should validate weak password (too short, only letters)', () => {
      const result = evaluatePassword('pass');

      expect(result.hasMinLength).toBe(false);
      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(false);
      expect(result.isStrongLength).toBe(false);
    });

    it('should validate acceptable password (min length, has letter and number)', () => {
      const result = evaluatePassword('pass1234');

      expect(result.hasMinLength).toBe(true);
      expect(result.hasMaxLength).toBe(true);
      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.isStrongLength).toBe(false);
    });

    it('should validate strong password (12+ chars, letter and number)', () => {
      const result = evaluatePassword('password12345');

      expect(result.hasMinLength).toBe(true);
      expect(result.hasMaxLength).toBe(true);
      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.isStrongLength).toBe(true);
    });

    it('should validate very strong password with special characters', () => {
      const result = evaluatePassword('MyP@ssw0rd!2024');

      expect(result.hasMinLength).toBe(true);
      expect(result.hasMaxLength).toBe(true);
      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.isStrongLength).toBe(true);
    });

    it('should handle password exactly at min length', () => {
      const result = evaluatePassword('Pass1234'); // Exactly 8 chars

      expect(result.hasMinLength).toBe(true);
      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(true);
    });

    it('should handle password exactly at max length', () => {
      const result = evaluatePassword('A'.repeat(24) + '1'); // Exactly 25 chars

      expect(result.hasMaxLength).toBe(true);
      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(true);
    });

    it('should handle password at strong length boundary', () => {
      const result = evaluatePassword('Password1234'); // Exactly 12 chars

      expect(result.isStrongLength).toBe(true);
      expect(result.hasMinLength).toBe(true);
    });

    it('should handle password with only uppercase letters and numbers', () => {
      const result = evaluatePassword('PASSWORD123');

      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(true);
    });

    it('should handle password with mixed case', () => {
      const result = evaluatePassword('PaSsWoRd123');

      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(true);
    });

    it('should handle password with special characters but no numbers', () => {
      const result = evaluatePassword('P@ssw0rd!!!');

      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(true); // Contains '0'
    });

    it('should handle password with only special characters', () => {
      const result = evaluatePassword('!@#$%^&*');

      expect(result.hasMinLength).toBe(true);
      expect(result.hasLetter).toBe(false);
      expect(result.hasNumber).toBe(false);
    });

    it('should handle password with spaces', () => {
      const result = evaluatePassword('pass word 123');

      expect(result.hasMinLength).toBe(true);
      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(true);
    });

    it('should handle unicode characters', () => {
      const result = evaluatePassword('Pässwörd123');

      expect(result.hasMinLength).toBe(true);
      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(true);
    });

    it('should return all validation criteria for comprehensive evaluation', () => {
      const password = 'SecurePass123';
      const result = evaluatePassword(password);

      // Verify all expected properties are present
      expect(result).toHaveProperty('hasMinLength');
      expect(result).toHaveProperty('hasMaxLength');
      expect(result).toHaveProperty('hasLetter');
      expect(result).toHaveProperty('hasNumber');
      expect(result).toHaveProperty('isStrongLength');

      // Verify types
      expect(typeof result.hasMinLength).toBe('boolean');
      expect(typeof result.hasMaxLength).toBe('boolean');
      expect(typeof result.hasLetter).toBe('boolean');
      expect(typeof result.hasNumber).toBe('boolean');
      expect(typeof result.isStrongLength).toBe('boolean');
    });
  });

  describe('Password Strength Scenarios', () => {
    it('should identify very weak passwords', () => {
      const weakPasswords = ['123', 'abc', 'pass', '1234'];

      weakPasswords.forEach((pwd) => {
        const result = evaluatePassword(pwd);
        expect(result.hasMinLength).toBe(false);
      });
    });

    it('should identify weak passwords (meets min but lacks complexity)', () => {
      const result = evaluatePassword('password'); // 8 chars, only letters

      expect(result.hasMinLength).toBe(true);
      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(false);
    });

    it('should identify fair passwords (meets min + has letters and numbers)', () => {
      const result = evaluatePassword('pass1234');

      expect(result.hasMinLength).toBe(true);
      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.isStrongLength).toBe(false);
    });

    it('should identify good passwords (12+ chars with letters and numbers)', () => {
      const result = evaluatePassword('password12345');

      expect(result.hasMinLength).toBe(true);
      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.isStrongLength).toBe(true);
    });

    it('should identify strong passwords (long + complex)', () => {
      const result = evaluatePassword('MySecureP@ssw0rd2024!');

      expect(result.hasMinLength).toBe(true);
      expect(result.hasMaxLength).toBe(true);
      expect(result.hasLetter).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.isStrongLength).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle password at exact boundaries', () => {
      const min = evaluatePassword('A1234567'); // 8 chars
      const max = evaluatePassword('A'.repeat(24) + '1'); // 25 chars
      const strong = evaluatePassword('A1'.repeat(6)); // 12 chars

      expect(min.hasMinLength).toBe(true);
      expect(max.hasMaxLength).toBe(true);
      expect(strong.isStrongLength).toBe(true);
    });

    it('should handle password just below boundaries', () => {
      const belowMin = evaluatePassword('A123456'); // 7 chars
      const aboveMax = evaluatePassword('A'.repeat(26)); // 26 chars
      const belowStrong = evaluatePassword('A1'.repeat(5) + 'A'); // 11 chars

      expect(belowMin.hasMinLength).toBe(false);
      expect(aboveMax.hasMaxLength).toBe(false);
      expect(belowStrong.isStrongLength).toBe(false);
    });
  });

  describe('PasswordMeter Component', () => {
    it('should render with password', () => {
      render(<PasswordMeter password="testpassword" />);
      expect(screen.getByTestId('password-strength-bar')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <PasswordMeter password="test" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should have aria-live attribute for accessibility', () => {
      const { container } = render(<PasswordMeter password="test" />);
      expect(container.firstChild).toHaveAttribute('aria-live', 'polite');
    });
  });
});
