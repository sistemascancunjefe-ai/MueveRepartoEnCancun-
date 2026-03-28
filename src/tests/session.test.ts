// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSession,
  saveSession,
  clearSession,
  isPro,
  isLoggedIn,
  getEmail,
  getPlan,
  getRepartidorName,
  setRepartidorName,
  setPro,
  setFree
} from '../lib/session';

describe('session.ts', () => {
  const KEYS = {
    TOKEN:  'mr-auth-token',
    PLAN:   'mr-plan',
    USER:   'mr-user-id',
    EMAIL:  'mr-email',
    NAME:   'mr-repartidor-name',
    STRIPE: 'mr-stripe-session',
    PHONE:  'mr-phone',
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getSession()', () => {
    it('should return null if token is missing', () => {
      expect(getSession()).toBeNull();
    });

    it('should return session object if token exists', () => {
      localStorage.setItem(KEYS.TOKEN, 'test-token');
      localStorage.setItem(KEYS.PLAN, 'pro');
      localStorage.setItem(KEYS.USER, 'user-123');
      localStorage.setItem(KEYS.EMAIL, 'test@example.com');

      const session = getSession();
      expect(session).toEqual({
        token: 'test-token',
        plan: 'pro',
        userId: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should return session with defaults if optional keys are missing', () => {
      localStorage.setItem(KEYS.TOKEN, 'test-token');

      const session = getSession();
      expect(session).toEqual({
        token: 'test-token',
        plan: 'free',
        userId: '',
        email: '',
      });
    });
  });

  describe('saveSession()', () => {
    it('should save session data to localStorage', () => {
      const sessionData = {
        token: 'new-token',
        plan: 'pro' as const,
        userId: 'user-456',
        email: 'new@example.com',
      };

      saveSession(sessionData);

      expect(localStorage.getItem(KEYS.TOKEN)).toBe('new-token');
      expect(localStorage.getItem(KEYS.PLAN)).toBe('pro');
      expect(localStorage.getItem(KEYS.USER)).toBe('user-456');
      expect(localStorage.getItem(KEYS.EMAIL)).toBe('new@example.com');
    });
  });

  describe('clearSession()', () => {
    it('should clear all session keys except the name', () => {
      localStorage.setItem(KEYS.TOKEN, 'token');
      localStorage.setItem(KEYS.PLAN, 'pro');
      localStorage.setItem(KEYS.USER, 'user');
      localStorage.setItem(KEYS.EMAIL, 'email');
      localStorage.setItem(KEYS.NAME, 'repartidor');
      localStorage.setItem(KEYS.STRIPE, 'stripe');
      localStorage.setItem(KEYS.PHONE, 'phone');

      clearSession();

      expect(localStorage.getItem(KEYS.TOKEN)).toBeNull();
      expect(localStorage.getItem(KEYS.PLAN)).toBeNull();
      expect(localStorage.getItem(KEYS.USER)).toBeNull();
      expect(localStorage.getItem(KEYS.EMAIL)).toBeNull();
      expect(localStorage.getItem(KEYS.STRIPE)).toBeNull();
      expect(localStorage.getItem(KEYS.PHONE)).toBeNull();

      expect(localStorage.getItem(KEYS.NAME)).toBe('repartidor');
    });
  });

  describe('isPro()', () => {
    it('should return true if plan is pro', () => {
      localStorage.setItem(KEYS.PLAN, 'pro');
      expect(isPro()).toBe(true);
    });

    it('should return false if plan is free or missing', () => {
      localStorage.setItem(KEYS.PLAN, 'free');
      expect(isPro()).toBe(false);
      localStorage.removeItem(KEYS.PLAN);
      expect(isPro()).toBe(false);
    });
  });

  describe('isLoggedIn()', () => {
    it('should return true if token exists', () => {
      localStorage.setItem(KEYS.TOKEN, 'token');
      expect(isLoggedIn()).toBe(true);
    });

    it('should return false if token is missing', () => {
      expect(isLoggedIn()).toBe(false);
    });
  });

  describe('getEmail()', () => {
    it('should return stored email', () => {
      localStorage.setItem(KEYS.EMAIL, 'test@test.com');
      expect(getEmail()).toBe('test@test.com');
    });

    it('should return empty string if email is missing', () => {
      expect(getEmail()).toBe('');
    });
  });

  describe('getPlan()', () => {
    it('should return stored plan', () => {
      localStorage.setItem(KEYS.PLAN, 'pro');
      expect(getPlan()).toBe('pro');
    });

    it('should return free as default', () => {
      expect(getPlan()).toBe('free');
    });
  });

  describe('Repartidor Name', () => {
    it('should set and get repartidor name', () => {
      setRepartidorName('Juan');
      expect(localStorage.getItem(KEYS.NAME)).toBe('Juan');
      expect(getRepartidorName()).toBe('Juan');
    });

    it('should return empty string if name is missing', () => {
      expect(getRepartidorName()).toBe('');
    });
  });

  describe('setPro()', () => {
    it('should set plan to pro', () => {
      setPro();
      expect(localStorage.getItem(KEYS.PLAN)).toBe('pro');
    });

    it('should set stripe session id if provided', () => {
      setPro('sess_123');
      expect(localStorage.getItem(KEYS.PLAN)).toBe('pro');
      expect(localStorage.getItem(KEYS.STRIPE)).toBe('sess_123');
    });
  });

  describe('setFree()', () => {
    it('should set plan to free and remove stripe session', () => {
      localStorage.setItem(KEYS.PLAN, 'pro');
      localStorage.setItem(KEYS.STRIPE, 'sess_123');

      setFree();

      expect(localStorage.getItem(KEYS.PLAN)).toBe('free');
      expect(localStorage.getItem(KEYS.STRIPE)).toBeNull();
    });
  });
});
