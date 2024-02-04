import { Router } from 'express';
import { admin_auth } from '../middlewares/index.js';
import {User,Business,Subscription,Review} from '../../models/index.js'
const router = Router();
import mongoose from 'mongoose';
import Stripe from 'stripe';
const stripe = Stripe('sk_test_51OZaW0SFypkk6r7E01zVSGbYkme0Or7XkT5PkfzEvY4VldQA2msl0HLb6vh0k3KPAKyAuDtmMtH4C6BtS2TbT7hk00gMefi9FO')



// ---------------------- METRICS ---------------------- //
// Get all users
router.get('/allusers', async (req, res) => {
  try {
    const users = await User.find({}).populate('business_id');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Get user by ID
router.post('/getuser', async (req, res) => {
  const uid = req.body.uid;
  try {
    const user = await User.findById(uid);
    //find stripe subscription if active
    const subscription = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active'
    });
    if (subscription.data.length > 0) {
      user.subscription = subscription.data[0];
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Disable a user
router.post('/disableuser', async (req, res) => {
  const uid = req.body.uid;
  try {
    await User.findByIdAndUpdate(uid, { isActivated: false });
    res.status(200).json({ message: 'User disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enable a user
router.post('/enableuser', async (req, res) => {
  const uid = req.body.uid;
  try {
    await User.findByIdAndUpdate(uid, { isActivated: true });
    res.status(200).json({ message: 'User enabled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Get user's reviews
router.post('/getuserreviews', async (req, res) => {
  const uid = req.body.uid;
  try {
    const user = await User.findById(uid);
    if (!user) {res.status(404).json({ message: 'User not found' });}
      const reviews = await Business.findById(user.business_id).populate('reviews');
    res.status(200).json(reviews.reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's business information
router.post('/getuserbusinesseinfo', async (req, res) => {
  const uid = req.body.uid;
  try {
    const user = await User.findById(uid);
    const business = await Business.findById(user.business_id);
    res.status(200).json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Disable user's subscription
router.post('/disableusersubscription', async (req, res) => {
  const uid = req.body.uid;
  try {
    const user = await User.findById(uid);
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ message: 'User not found or Stripe customer ID missing.' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active'
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ message: 'No active subscriptions found for this user.' });
    }

    // Cancel the active subscription
    await stripe.subscriptions.del(subscriptions.data[0].id);

    res.status(200).json({ message: 'Subscription disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enable user's subscription (Creating a new subscription)
router.post('/enableusersubscription',admin_auth, async (req, res) => {
  const uid = req.body.uid;
  const planId = req.body.planId; // You need the plan ID to create a new subscription
  try {
    const user = await User.findById(uid);
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ message: 'User not found or Stripe customer ID missing.' });
    }

    // Create a new subscription
    await stripe.subscriptions.create({
      customer: user.stripeCustomerId,payment_settings: {
        payment_method_types: ['card'],
      },
      items: [{ plan: planId }],
       trial_end: 1710403705,
    });
    user.isPremium = true;
    await user.save();
    res.status(200).json({ message: 'Subscription enabled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upgrade user's subscription
router.post('/upgradeusersubscription', async (req, res) => {
  const uid = req.body.uid;
  const newPlanId = req.body.newPlanId;
  try {
    const user = await User.findById(uid);
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ message: 'User not found or Stripe customer ID missing.' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active'
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ message: 'No active subscriptions found for this user.' });
    }

    // Update the subscription with the new plan
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      items: [{ id: subscriptions.data[0].items.data[0].id, plan: newPlanId }],
    });

    res.status(200).json({ message: 'Subscription upgraded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


//get all business
router.get('/getallbusiness', async (req, res) => {
  try {
    const business = await Business.find({}).populate('user_id');
    res.status(200).json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

// ---------------------- METRICS ---------------------- //

// ---------------------- ADMIN PAYMENT ---------------------- //
// get subscription plans
router.get('/getplans',admin_auth,async (req, res) => {
  try {
    const plans = await Subscription.find({});
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/update-plan', admin_auth, async (req, res) => {
  const { planId: priceId } = req.body;
  try {
    if (!priceId) {
      return res.status(400).send({ message: 'Plan ID is required.' });
    }
    const subscription = await Subscription.findOne({ priceId: priceId });
    if (!subscription) {
      return res.status(404).send({ message: 'Subscription plan not found.' });
    }

    const updatedFields = {};
    if (req.body.name) updatedFields.name = req.body.name;
    if (req.body.trialPeriodDays) updatedFields.trialPeriodDays = req.body.trialDays;

    // If price needs to be updated, create a new Stripe price
    if (req.body.price) {
      const stripePrice = await stripe.prices.retrieve(priceId);
      console.log(stripePrice.recurring)
      const newStripePrice = await stripe.prices.create({
        unit_amount: req.body.price * 100,
        currency: stripePrice.currency,
        recurring: {
          interval: stripePrice.recurring.interval,
          interval_count: stripePrice.recurring.interval_count,
          trial_period_days: stripePrice.recurring.trial_period_days,
        },
        product: stripePrice.product,
      });
      // Update the subscription plan with the new price ID
      updatedFields.price = req.body.price; // Assuming you store the price amount in your DB
      updatedFields.priceId = newStripePrice.id; // Update the reference to the new Stripe price ID
    }

    if (req.body.name) {
      const stripePrice = await stripe.prices.retrieve(priceId);
      await stripe.products.update(stripePrice.product, { name: req.body.name });
    }

    // Update subscription plan in database
    const updatedSubscription = await Subscription.findOneAndUpdate(
      { priceId: priceId },
      updatedFields,
      { new: true }
    );

    res.status(200).send({ message: 'Subscription plan updated successfully.', updatedSubscription });
  } catch (error) {
    console.error('Failed to update subscription plan:', error);
    res.status(500).send({ message: error.message });
  }
});

// ---------------------- ADMIN PAYMENT ---------------------- //

export default router


