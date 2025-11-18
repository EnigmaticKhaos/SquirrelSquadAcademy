import Stripe from 'stripe';
import { config } from '../config/env';
import User from '../models/User';
import { sendPurchaseConfirmationEmail } from './email/emailService';
import logger from '../utils/logger';

const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2025-10-29.clover',
});

export const createCheckoutSession = async (userId: string, priceId: string): Promise<string> => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${config.frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontendUrl}/subscription/cancel`,
      metadata: {
        userId: userId.toString(),
      },
    });

    return session.url || '';
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    throw error;
  }
};

export const handleWebhook = async (event: Stripe.Event): Promise<void> => {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSubscriptionCreated(session);
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    logger.error('Error handling webhook:', error);
    throw error;
  }
};

const handleSubscriptionCreated = async (session: Stripe.Checkout.Session): Promise<void> => {
  const userId = session.metadata?.userId;

  if (!userId) {
    throw new Error('User ID not found in session metadata');
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Update user subscription
  user.subscription.tier = 'premium';
  user.subscription.stripeCustomerId = session.customer as string;
  user.subscription.stripeSubscriptionId = session.subscription as string;
  user.subscription.currentPeriodEnd = new Date((session.subscription as any)?.current_period_end * 1000);
  await user.save();

  // Send confirmation email
  await sendPurchaseConfirmationEmail(user.email, 0, 'premium');

  // Check and complete referral if user used a referral code
  import('./referralService').then(({ checkAndCompleteReferral }) => {
    checkAndCompleteReferral(userId).catch((error) => {
      logger.error('Error checking referral completion:', error);
    });
  });

  logger.info(`Subscription created for user ${userId}`);
};

const handleSubscriptionUpdated = async (subscription: Stripe.Subscription): Promise<void> => {
  const user = await User.findOne({
    'subscription.stripeSubscriptionId': subscription.id,
  });

  if (!user) {
    throw new Error('User not found');
  }

  user.subscription.currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
  await user.save();

  logger.info(`Subscription updated for user ${user._id}`);
};

const handleSubscriptionDeleted = async (subscription: Stripe.Subscription): Promise<void> => {
  const user = await User.findOne({
    'subscription.stripeSubscriptionId': subscription.id,
  });

  if (!user) {
    throw new Error('User not found');
  }

  user.subscription.tier = 'free';
  user.subscription.stripeSubscriptionId = undefined;
  user.subscription.currentPeriodEnd = undefined;
  await user.save();

  logger.info(`Subscription cancelled for user ${user._id}`);
};

export default stripe;

