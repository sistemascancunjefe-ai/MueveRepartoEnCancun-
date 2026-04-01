// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as freemium from '../lib/freemium';
import { isPro } from '../lib/session';

vi.mock('../lib/session', () => ({
  isPro: vi.fn(),
}));

describe('Freemium Logic', () => {
  const INSTALL_DATE_KEY = 'mr-install-date';
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  beforeEach(() => {
    localStorage.clear();
    vi.mocked(isPro).mockReturnValue(false);
    vi.useFakeTimers();
    // Set a fixed system time: 2024-01-01
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initInstallDate', () => {
    it('should set the install date if not present', () => {
      const now = Date.now();
      const result = freemium.initInstallDate();

      expect(result).toBe(now);
      expect(localStorage.getItem(INSTALL_DATE_KEY)).toBe(String(now));
    });

    it('should not overwrite an existing install date', () => {
      const pastDate = Date.now() - MS_PER_DAY;
      localStorage.setItem(INSTALL_DATE_KEY, String(pastDate));

      const result = freemium.initInstallDate();

      expect(result).toBe(pastDate);
      expect(localStorage.getItem(INSTALL_DATE_KEY)).toBe(String(pastDate));
    });
  });

  describe('getInstallDate', () => {
    it('should return stored date if present', () => {
      const pastDate = 123456789;
      localStorage.setItem(INSTALL_DATE_KEY, String(pastDate));
      expect(freemium.getInstallDate()).toBe(pastDate);
    });

    it('should return current date if not present', () => {
      const now = Date.now();
      expect(freemium.getInstallDate()).toBe(now);
    });
  });

  describe('Calculations based on time', () => {
    beforeEach(() => {
      // Initialize install date to "now" (2024-01-01)
      freemium.initInstallDate();
    });

    it('should return 0 days used on the same day', () => {
      expect(freemium.getDaysUsed()).toBe(0);
      expect(freemium.getTrialDaysRemaining()).toBe(freemium.TRIAL_DAYS);
    });

    it('should return 15 days used after 15 days', () => {
      vi.advanceTimersByTime(15 * MS_PER_DAY);
      expect(freemium.getDaysUsed()).toBe(15);
      expect(freemium.getTrialDaysRemaining()).toBe(freemium.TRIAL_DAYS - 15);
    });

    it('should return 31 days used on the last day of trial', () => {
      vi.advanceTimersByTime(31 * MS_PER_DAY);
      expect(freemium.getDaysUsed()).toBe(31);
      expect(freemium.getTrialDaysRemaining()).toBe(0);
    });

    it('should return 32 days used after trial ends', () => {
      vi.advanceTimersByTime(32 * MS_PER_DAY);
      expect(freemium.getDaysUsed()).toBe(32);
      expect(freemium.getTrialDaysRemaining()).toBe(0);
    });
  });

  describe('Access and Limits', () => {
    describe('Free Plan', () => {
      beforeEach(() => {
        vi.mocked(isPro).mockReturnValue(false);
        freemium.initInstallDate();
      });

      it('should have full access during trial (Day 0)', () => {
        expect(freemium.hasFullAccess()).toBe(true);
        expect(freemium.isFreemiumRestricted()).toBe(false);
        expect(freemium.getStopLimit()).toBe(Infinity);
      });

      it('should have full access on Day 31', () => {
        vi.advanceTimersByTime(31 * MS_PER_DAY);
        expect(freemium.hasFullAccess()).toBe(true);
        expect(freemium.isFreemiumRestricted()).toBe(false);
        expect(freemium.getStopLimit()).toBe(Infinity);
      });

      it('should be restricted on Day 32', () => {
        vi.advanceTimersByTime(32 * MS_PER_DAY);
        expect(freemium.hasFullAccess()).toBe(false);
        expect(freemium.isFreemiumRestricted()).toBe(true);
        expect(freemium.getStopLimit()).toBe(freemium.FREE_STOP_LIMIT);
      });
    });

    describe('Pro Plan', () => {
      beforeEach(() => {
        vi.mocked(isPro).mockReturnValue(true);
        freemium.initInstallDate();
      });

      it('should have full access regardless of days used (Day 0)', () => {
        expect(freemium.hasFullAccess()).toBe(true);
        expect(freemium.isFreemiumRestricted()).toBe(false);
        expect(freemium.getStopLimit()).toBe(Infinity);
      });

      it('should have full access regardless of days used (Day 100)', () => {
        vi.advanceTimersByTime(100 * MS_PER_DAY);
        expect(freemium.hasFullAccess()).toBe(true);
        expect(freemium.isFreemiumRestricted()).toBe(false);
        expect(freemium.getStopLimit()).toBe(Infinity);
      });
    });
  });

  describe('getFreemiumStatus', () => {
    it('should return correct status for a new free user', () => {
      vi.mocked(isPro).mockReturnValue(false);
      freemium.initInstallDate();

      const status = freemium.getFreemiumStatus();
      expect(status).toEqual({
        isPro: false,
        inTrial: true,
        isRestricted: false,
        daysUsed: 0,
        daysRemaining: freemium.TRIAL_DAYS,
        stopLimit: Infinity
      });
    });

    it('should return correct status for an expired free user', () => {
      vi.mocked(isPro).mockReturnValue(false);
      freemium.initInstallDate();
      vi.advanceTimersByTime(32 * MS_PER_DAY);

      const status = freemium.getFreemiumStatus();
      expect(status).toEqual({
        isPro: false,
        inTrial: false,
        isRestricted: true,
        daysUsed: 32,
        daysRemaining: 0,
        stopLimit: freemium.FREE_STOP_LIMIT
      });
    });

    it('should return correct status for a Pro user', () => {
      vi.mocked(isPro).mockReturnValue(true);
      freemium.initInstallDate();
      vi.advanceTimersByTime(40 * MS_PER_DAY);

      const status = freemium.getFreemiumStatus();
      expect(status).toEqual({
        isPro: true,
        inTrial: true, // Pro is always considered "in trial" (full access) in the implementation logic
        isRestricted: false,
        daysUsed: 40,
        daysRemaining: 0,
        stopLimit: Infinity
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle corrupted install date', () => {
      localStorage.setItem(INSTALL_DATE_KEY, 'not-a-number');
      const now = Date.now();
      // parseInt('not-a-number') is NaN, NaN || now is now
      expect(freemium.getInstallDate()).toBe(now);
    });
  });
});
