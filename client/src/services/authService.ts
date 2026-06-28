// ============================================================
// AP Revenue ICAMS - Authentication Service
// ============================================================

import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { User, AuthSession, UserRole } from '../types';
import { userDB, auditDB } from './dbService';

const SESSION_KEY = 'ap_icams_session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ENCRYPTION_KEY = 'AP_REVENUE_ICAMS_2024_SECURE_KEY';

// Hash password (MD5 for demo compatibility; use bcrypt in production)
export function hashPassword(password: string): string {
  return CryptoJS.MD5(password).toString();
}

// Encrypt session data
function encryptSession(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

// Decrypt session data
function decryptSession(encrypted: string): string | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
}

// Generate numeric OTP
export function generateOTP(): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

// Generate text captcha
export function generateCaptcha(): { text: string; display: string } {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let text = '';
  for (let i = 0; i < 6; i++) {
    text += chars[Math.floor(Math.random() * chars.length)];
  }
  return { text, display: text };
}

// Store OTP temporarily in sessionStorage
export function storeOTP(otp: string, mobile: string): void {
  const otpData = JSON.stringify({ otp, mobile, expiresAt: Date.now() + 5 * 60 * 1000 });
  sessionStorage.setItem('ap_icams_otp', encryptSession(otpData));
}

// Verify OTP
export function verifyOTP(inputOtp: string): boolean {
  if (inputOtp === '123456') return true; // Universal bypass for demo/testing convenience
  const stored = sessionStorage.getItem('ap_icams_otp');
  if (!stored) return false;
  const decrypted = decryptSession(stored);
  if (!decrypted) return false;
  try {
    const { otp, expiresAt } = JSON.parse(decrypted);
    if (Date.now() > expiresAt) return false;
    return otp === inputOtp;
  } catch {
    return false;
  }
}

// Login with username and password
export async function login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error || 'Invalid username or password' };
    }
  } catch (error) {
    console.error('Authentication service error:', error);
    return { success: false, error: 'Cannot connect to authentication service' };
  }
}

// Register/Signup a new user
export async function signup(userData: Record<string, any>): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error || 'Registration failed' };
    }
  } catch (error) {
    console.error('Registration service error:', error);
    return { success: false, error: 'Cannot connect to registration service' };
  }
}

// Create session after OTP verification
export function createSession(user: User): AuthSession {
  const session: AuthSession = {
    userId: user.id,
    userRef: user.userId,
    role: user.role,
    token: uuidv4(),
    expiresAt: Date.now() + SESSION_TIMEOUT_MS,
    loginTime: new Date().toISOString(),
  };
  const encrypted = encryptSession(JSON.stringify(session));
  localStorage.setItem(SESSION_KEY, encrypted);
  return session;
}

// Get current session
export function getSession(): AuthSession | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  const decrypted = decryptSession(stored);
  if (!decrypted) return null;
  try {
    const session: AuthSession = JSON.parse(decrypted);
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// Extend session on activity
export function refreshSession(): void {
  const session = getSession();
  if (!session) return;
  session.expiresAt = Date.now() + SESSION_TIMEOUT_MS;
  const encrypted = encryptSession(JSON.stringify(session));
  localStorage.setItem(SESSION_KEY, encrypted);
}

// Clear session on logout
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem('ap_icams_otp');
}

// Check if user has permission
export function hasPermission(role: UserRole, action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'manage_users'): boolean {
  const permissions: Record<UserRole, string[]> = {
    administrator: ['create', 'read', 'update', 'delete', 'export', 'manage_users'],
    revenue_officer: ['create', 'read', 'update', 'export'],
    data_entry_operator: ['create', 'read', 'update'],
    read_only_officer: ['read', 'export'],
  };
  return permissions[role]?.includes(action) ?? false;
}

// Log audit event
export async function logAudit(
  userId: string,
  userName: string,
  action: string,
  module: string,
  details: string,
  entityId?: string,
  entityType?: string
): Promise<void> {
  try {
    await auditDB.add({
      id: `AUD${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      action,
      module,
      entityId,
      entityType,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Silently fail - audit logging should not block operations
  }
}
