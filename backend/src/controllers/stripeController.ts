import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import { createCheckoutSession, handleWebhook } from '../services/stripeService';
import stripe from '../services/stripeService';
import { config } from '../config/env';
import User, { IUser } from '../models/User';
import logger from '../utils/logger';

// @desc    Create checkout session
// @route   POST /api/stripe/create-checkout-session
// @access  Private
export const createCheckout = asyncHandler(async (req: Request, res: Response) => {
  const { priceId } = req.body;

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  if (!priceId) {
    return res.status(400).json({
      success: false,
      message: 'Price ID is required',
    });
  }

  const sessionUrl = await createCheckoutSession(userDoc._id.toString(), priceId);

  res.json({
    success: true,
    url: sessionUrl,
  });
});

// @desc    Stripe webhook
// @route   POST /api/stripe/webhook
// @access  Public (Stripe signature verification)
export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({
      success: false,
      message: 'No signature',
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripeWebhookSecret
    );
  } catch (err: any) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({
      success: false,
      message: `Webhook Error: ${err.message}`,
    });
  }

  await handleWebhook(event);

  res.json({ received: true });
});

// @desc    Get subscription status
// @route   GET /api/stripe/subscription
// @access  Private
export const getSubscription = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const user = await User.findById(userDoc._id);

  res.json({
    success: true,
    subscription: user?.subscription,
  });
});

// @desc    Cancel subscription
// @route   POST /api/stripe/cancel-subscription
// @access  Private
export const cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const user = await User.findById(userDoc._id);

  if (!user || !user.subscription.stripeSubscriptionId) {
    return res.status(400).json({
      success: false,
      message: 'No active subscription found',
    });
  }

  await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);

  res.json({
    success: true,
    message: 'Subscription cancelled successfully',
  });
});

