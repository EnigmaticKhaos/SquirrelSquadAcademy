import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { config } from '../config/env';

export interface TwoFactorSecret {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export const generateTwoFactorSecret = async (userEmail: string, serviceName: string = 'SquirrelSquad Academy'): Promise<TwoFactorSecret> => {
  const secret = speakeasy.generateSecret({
    name: `${serviceName} (${userEmail})`,
    issuer: serviceName,
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () => 
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );

  return {
    secret: secret.base32 || '',
    qrCodeUrl,
    backupCodes,
  };
};

export const verifyTwoFactorToken = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps (60 seconds) of tolerance
  });
};

export const verifyBackupCode = (code: string, backupCodes: string[]): boolean => {
  return backupCodes.includes(code.toUpperCase());
};

