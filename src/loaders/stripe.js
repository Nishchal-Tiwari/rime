import Stripe from "stripe";
import Subscription from "../models/subscriptions.js";
import { StripeApiKey } from "../config/index.js";
import mongoose from "mongoose";
const stripe = Stripe(StripeApiKey);
const predefinedPlans = [
  {
    id: "RemiPlanXI",
    name: "Basic Plan",
    price: 5000,
    currency: "inr",
    interval: "month",
    trialDays: 14,
    interval_count:1
  },
  {
    id: "RemiPlanXII",
    name: "Standard Plan",
    price: 10000,
    currency: "inr",
    interval: "month",
    trialDays: 14,
    interval_count:3
  },
  {
    id: "RemiPlanXIII",
    name: "Premium Plan",
    price: 15000,
    currency: "inr",
    interval: "month",
    trialDays: 14,
    interval_count:6
  },
  {
    id: "RemiPlanXIV",
    name: "Ultimate Plan",
    price: 20000,
    currency: "inr",
    interval: "year",
    trialDays: 14,
    interval_count:1
  },
];

const stripeLoader = async () => {
  try {
    for (const plan of predefinedPlans) {
      // Check if the plan exists based on metadata id

      const prices = await stripe.prices.list({});

      let stripePrice;
      const existingPrice = prices.data.find(
        (price) => price.metadata.id === plan.id
      );
      if (!existingPrice) {
        // Create product in Stripe with metadata id if it doesn't exist

        stripePrice = await stripe.prices.create({
          currency: plan.currency,
          unit_amount: plan.price,
          recurring: {
            interval: plan.interval,
            interval_count: plan.interval_count,
            trial_period_days: plan.trialDays,
          },
          product_data: {
            name: plan.name,
          },
          metadata: {
            id: plan.id,
          },
        });
      } else {
        stripePrice = existingPrice;
      }

      // Check and update or create the plan in your database
      const subscription = await Subscription.findOne({
        priceId: stripePrice.id,
      });

      if (!subscription) {
        // If the subscription doesn't exist in the database, create it
        const newSubscription = new Subscription({
          metaid: plan.id,
          priceId: stripePrice.id, // Use Stripe product ID as reference
          name: plan.name,
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval,
          trialDays: plan.trialDays,
          features: [], // Add features as necessary,
          productId: stripePrice.product,
        });

        await newSubscription.save();
      } else {
        // Optionally, update existing subscription details
      }
    }
  } catch (error) {
    console.error("Error initializing Stripe products:", error);
  }
};

export default stripeLoader;
