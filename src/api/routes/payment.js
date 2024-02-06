import express  from 'express';
const Router = express.Router();
import User from '../../models/user.js';
import Business from '../../models/business.js';
import Subscription from '../../models/subscriptions.js';
import { auth, imageUpload } from '../middlewares/index.js';
import Stripe from 'stripe';
import { StripeApiKey } from '../../config/index.js';
import subscriptions from '../../models/subscriptions.js';
const stripe = Stripe(StripeApiKey)
import { FrontendUrl } from '../../config/index.js';
import { BackendUrl } from '../../config/index.js';
Router.get('/listPlans', async (req, res) => {
  try{
    const plans = await subscriptions.find({});
    res.status(200).json(plans);
  }
  catch(err){
    res.status(500).json({error:err.message})
  }
});

// redirect user to save a card 
Router.get('/saveCard', auth, async (req, res) => {
    const user_id = req.user._id;
    try {
        const user = await User.findById(user_id);
        if (!user || !user.stripeCustomerId) {
            return res.status(404).json({ message: 'User not found or not linked to a Stripe customer.' });
        }
        const session = await stripe.checkout.sessions.create({
            customer: user.stripeCustomerId,
            payment_method_types: ['card'],
            mode: 'setup',
            success_url: `${BackendUrl}/success`, // URL to which customer is redirected after successful payment
            cancel_url: `${BackendUrl}/cancel`, // URL to which customer is redirected if they cancel the payment
        });
        res.status(200).json({ sessionId: session.url });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
})

// list saved cards of current user
Router.get('/listCards', auth, async (req, res) => {
    const user_id = req.user._id;
    try {
        const user = await User.findById(user_id);
        if (!user || !user.stripeCustomerId) {
            return res.status(404).json({ message: 'User not found or not linked to a Stripe customer.' });
        }
        const paymentMethods = await stripe.paymentMethods.list({
            customer: user.stripeCustomerId,
            type: 'card',
        });
        res.status(200).json(paymentMethods);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
})
Router.post('/deleteCard', auth, async (req, res) => {
    const { cardId } = req.body;
    try {
        const paymentMethod = await stripe.paymentMethods.detach(cardId);
        res.status(200).json(paymentMethod);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
})

// get all transactions of current user 
Router.get('/listTransactions', auth, async (req, res) => {
    const user_id = req.user._id;
    try {
        const user = await User.findById(user_id);
        if (!user || !user.stripeCustomerId) {
            return res.status(404).json({ message: 'User not found or not linked to a Stripe customer.' });
        }
        const transactions = await stripe.charges.list({
            customer: user.stripeCustomerId
        });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})
// get current subscription info 
Router.get('/getSubscription', auth, async (req, res) => {
    const user_id = req.user._id;
    try {
        const user = await User.findById(user_id);
        if (!user || !user.stripeCustomerId) {
            return res.status(404).json({ message: 'User not found or not linked to a Stripe customer.' });
        }
        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            limit: 1
        });
        res.status(200).json(subscriptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    
    }})


// Create Subscription for a Business with Payment
Router.post('/createSubscription',auth, async (req, res) => {
  const { planId } = req.body;
  const user_id = req.user._id;
  try {
      const user = await User.findById(user_id); 
      if (!user || user.stripeCustomerId==null) 
      {
          return res.status(404).json({ message: 'User not found or not linked to a Stripe customer.' });
      }
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active'
      });

      if (subscriptions.data.length > 0) {
      return res.status(404).json({ message: 'active subscriptions found for this user.' });
    }
      // Create a checkout session
      const session = await stripe.checkout.sessions.create({
          customer: user.stripeCustomerId,
          payment_method_types: ['card'],
          line_items: [{
              price: planId,
              quantity: 1
          }],
          mode: 'subscription',
          success_url: `${BackendUrl}/success`, // URL to which customer is redirected after successful payment
          cancel_url: `${BackendUrl}/cancel`, // URL to which customer is redirected if they cancel the payment
      });
      res.status(200).json({ sessionId: session.id });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Get Subscription Status
Router.get('/getSubscriptionStatus', auth, async (req, res) => {
    const user_id = req.user._id;
    try {
        const user = await User.findById(user_id);
        if (!user || !user.stripeCustomerId) {
            return res.status(404).json({ message: 'User not found or not linked to a Stripe customer.' });
        }
        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            limit: 1
        });

        // Assuming each subscription has at least one item and we're interested in the first subscription only
        if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0]; // Get the first subscription
            const items = subscription.items.data;
            const product = await stripe.products.retrieve(items[0].price.product); 
            if (items.length > 0) {
                const planDetails = items.map(item => {
                    
                    return {
                    name:product.name,
                    priceId: item.price.id // Assuming you're looking for the price ID
                }});

                // Respond with the planName and priceId only
                res.status(200).json(planDetails);
            } else {
                res.status(404).json({ message: 'No subscription items found.' });
            }
        } else {
            res.status(404).json({ message: 'No active subscriptions found.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




//manage subscriptions
Router.get('/manage-subscription',auth, async (req, res) => {
    try {
        const userId = req.user._id; // Authenticate and identify the user
    const stripeCustomerId = await getStripeCustomerIdByUserId(userId); // Implement this function
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: FrontendUrl, // Where users are redirected after leaving the portal
      });
  
      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      res.status(500).json({ error: error.message });
    }
  })

  const getStripeCustomerIdByUserId = async (userId) => {
    const user = await User.findById(userId);
    return user.stripeCustomerId;
}



export default Router;