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
  setFree,
  type Session
} from '../lib/session';

const KEYS = {
  TOKEN:  'mr-auth-token',
  PLAN:   'mr-plan',
  USER:   'mr-user-id',
  EMAIL:  'mr-email',
  NAME:   'mr-repartidor-name',
} as const;

describe('Session Management', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getSession', () => {
    it('should return null if no token is present', () => {
      expect(getSession()).toBeNull();
    });

    it('should return session object if token is present', () => {
      localStorage.setItem(KEYS.TOKEN, 'test-token');
      localStorage.setItem(KEYS.PLAN, 'pro');
      localStorage.setItem(KEYS.USER, 'user-123');
      localStorage.setItem(KEYS.EMAIL, 'test@example.com');

      const session = getSession();
      expect(session).toEqual({
        token: 'test-token',
        plan: 'pro',
        userId: 'user-123',
        email: 'test@example.com'
      });
    });

    it('should default to free plan and empty strings if other keys are missing', () => {
      localStorage.setItem(KEYS.TOKEN, 'test-token');

      const session = getSession();
      expect(session).toEqual({
        token: 'test-token',
        plan: 'free',
        userId: '',
        email: ''
      });
    });
  });

  describe('saveSession', () => {
    it('should save session data to localStorage', () => {
      const session: Session = {
        token: 'new-token',
        plan: 'pro',
        userId: 'user-456',
        email: 'new@example.com'
      };

      saveSession(session);

      expect(localStorage.getItem(KEYS.TOKEN)).toBe('new-token');
      expect(localStorage.getItem(KEYS.PLAN)).toBe('pro');
      expect(localStorage.getItem(KEYS.USER)).toBe('user-456');
      expect(localStorage.getItem(KEYS.EMAIL)).toBe('new@example.com');
    });
  });

  describe('clearSession', () => {
    it('should clear all session keys except NAME', () => {
      localStorage.setItem(KEYS.TOKEN, 'token');
      localStorage.setItem(KEYS.PLAN, 'pro');
      localStorage.setItem(KEYS.USER, 'user');
      localStorage.setItem(KEYS.EMAIL, 'email');
      localStorage.setItem(KEYS.NAME, 'repartidor');
      localStorage.setItem('mr-stripe-session', 'stripe-123');
      localStorage.setItem('mr-phone', '123456789');

      clearSession();

      expect(localStorage.getItem(KEYS.TOKEN)).toBeNull();
      expect(localStorage.getItem(KEYS.PLAN)).toBeNull();
      expect(localStorage.getItem(KEYS.USER)).toBeNull();
      expect(localStorage.getItem(KEYS.EMAIL)).toBeNull();
      expect(localStorage.getItem('mr-stripe-session')).toBeNull();
      expect(localStorage.getItem('mr-phone')).toBeNull();

      // Name should be preserved
      expect(localStorage.getItem(KEYS.NAME)).toBe('repartidor');
    });
  });

  describe('Utility getters', () => {
    it('isPro should return true if plan is pro', () => {
      localStorage.setItem(KEYS.PLAN, 'pro');
      expect(isPro()).toBe(true);
    });

    it('isPro should return false if plan is free or missing', () => {
      localStorage.setItem(KEYS.PLAN, 'free');
      expect(isPro()).toBe(false);
      localStorage.removeItem(KEYS.PLAN);
      expect(isPro()).toBe(false);
    });

    it('isLoggedIn should return true if token exists', () => {
      localStorage.setItem(KEYS.TOKEN, 'token');
      expect(isLoggedIn()).toBe(true);
    });

    it('isLoggedIn should return false if token is missing', () => {
      expect(isLoggedIn()).toBe(false);
    });

    it('getEmail should return email or empty string', () => {
      localStorage.setItem(KEYS.EMAIL, 'test@example.com');
      expect(getEmail()).toBe('test@example.com');
      localStorage.removeItem(KEYS.EMAIL);
      expect(getEmail()).toBe('');
    });

    it('getPlan should return plan or free', () => {
      localStorage.setItem(KEYS.PLAN, 'pro');
      expect(getPlan()).toBe('pro');
      localStorage.removeItem(KEYS.PLAN);
      expect(getPlan()).toBe('free');
    });

    it('getRepartidorName should return name or empty string', () => {
      localStorage.setItem(KEYS.NAME, 'Juan');
      expect(getRepartidorName()).toBe('Juan');
      localStorage.removeItem(KEYS.NAME);
      expect(getRepartidorName()).toBe('');
    });
  });

  describe('Utility setters', () => {
    it('setRepartidorName should set name in localStorage', () => {
      setRepartidorName('Pedro');
      expect(localStorage.getItem(KEYS.NAME)).toBe('Pedro');
    });

    it('setPro should set plan to pro and optionally set stripe session', () => {
      setPro('stripe-xyz');
      expect(localStorage.getItem(KEYS.PLAN)).toBe('pro');
      expect(localStorage.getItem('mr-stripe-session')).toBe('stripe-xyz');

      localStorage.clear();
      setPro();
      expect(localStorage.getItem(KEYS.PLAN)).toBe('pro');
      expect(localStorage.getItem('mr-stripe-session')).toBeNull();
    });

    it('setFree should set plan to free and remove stripe session', () => {
      localStorage.setItem(KEYS.PLAN, 'pro');
      localStorage.setItem('mr-stripe-session', 'stripe-xyz');

      setFree();
      expect(localStorage.getItem(KEYS.PLAN)).toBe('free');
      expect(localStorage.getItem('mr-stripe-session')).toBeNull();
    });
  });
});
