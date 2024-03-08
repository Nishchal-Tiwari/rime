import { Router } from 'express';
import { admin_auth } from '../middlewares/index.js';
import {User,Business,Subscription,Review} from '../../models/index.js'
const router = Router();
import mongoose from 'mongoose';
import Stripe from 'stripe';
const stripe = Stripe('sk_test_51OZaW0SFypkk6r7E01zVSGbYkme0Or7XkT5PkfzEvY4VldQA2msl0HLb6vh0k3KPAKyAuDtmMtH4C6BtS2TbT7hk00gMefi9FO')



// ---------------------- METRICS ---------------------- //
// Get all users
router.get('/allusers', admin_auth,async (req, res) => {
  try {
    const users = await User.find({}).populate('business_id');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/weeklyusers', async (req, res) => {
  try {
    // Calculate the start and end of the current week
    const now = new Date();
    const first = now.getDate() - now.getDay(); // First day is the day of the month - the day of the week
    const last = first + 6; // last day is the first day + 6

    const startDate = new Date(now.setDate(first));
    startDate.setHours(0, 0, 0, 0); // Start of the first day of the week

    const endDate = new Date(now.setDate(last));
    endDate.setHours(23, 59, 59, 999); // End of the last day of the week

    const dailyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: "$createdAt" }
        }
      },
      {
        $group: {
          _id: "$dayOfWeek",
          totalUsers: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    // Initialize counts for each day of the week
    let dailyCounts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0};

    // Map the aggregation results to the initialized days
    dailyRegistrations.forEach(({ _id, totalUsers }) => {
      dailyCounts[_id] = totalUsers;
    });

    // Optionally, convert to day names
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let results = {};
    for (let i = 1; i <= 7; i++) {
      results[dayNames[i - 1]] = dailyCounts[i];
    }

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/monthlyusers', admin_auth,async (req, res) => {
  try {
    const monthlyRegistrations = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalUsers: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      },
      {
        $project: {
          _id: 0, // Exclude the _id field
          month: "$_id.month",
          totalUsers: 1
        }
      }
    ]);

    // Initialize an object for all months with a default value of 0
    let monthlyCounts = {};
    for (let i = 1; i <= 12; i++) {
      monthlyCounts[i] = 0;
    }

    // Update the counts for months that are present in the database
    monthlyRegistrations.forEach((registration) => {
      monthlyCounts[registration.month] = registration.totalUsers;
    });

    res.status(200).json(monthlyCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});





// Get user by ID
router.post('/getuser',admin_auth, async (req, res) => {
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
router.post('/disableuser', admin_auth,async (req, res) => {
  const uid = req.body.uid;
  try {
    await User.findByIdAndUpdate(uid, { isActivated: false });
    res.status(200).json({ message: 'User disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enable a user
router.post('/enableuser',admin_auth, async (req, res) => {
  const uid = req.body.uid;
  try {
    await User.findByIdAndUpdate(uid, { isActivated: true });
    res.status(200).json({ message: 'User enabled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Get user's reviews
router.post('/getuserreviews', admin_auth,async (req, res) => {
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
router.post('/getuserbusinesseinfo', admin_auth,async (req, res) => {
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
router.post('/disableusersubscription', admin_auth,async (req, res) => {
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
router.post('/upgradeusersubscription', admin_auth,async (req, res) => {
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
router.get('/getallbusiness', admin_auth,async (req, res) => {
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
router.get('/getplans',async (req, res) => {
  try {
    const plans = await Subscription.find({});
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/update-plan',admin_auth, admin_auth, async (req, res) => {
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


