import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { config } from '../config/env';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JWTPayload): string => {
  const secret: string = config.jwtSecret || 'default-secret';
  const options: SignOptions = {
    expiresIn: (config.jwtExpire || '7d') as StringValue,
  };
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const secret: string = config.jwtSecret || 'default-secret';
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  const secret: string = config.jwtSecret || 'default-secret';
  const options: SignOptions = {
    expiresIn: '30d' as StringValue,
  };
  return jwt.sign(payload, secret, options);
};

