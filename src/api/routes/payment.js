import express  from 'express';
import Stripe from 'stripe';
const Router = express.Router();
import User from '../../models/user.js';
import Business from '../../models/business.js';
const stripe = Stripe('sk_test_51OZaW0SFypkk6r7E01zVSGbYkme0Or7XkT5PkfzEvY4VldQA2msl0HLb6vh0k3KPAKyAuDtmMtH4C6BtS2TbT7hk00gMefi9FO')
import { auth, imageUpload } from '../middlewares/index.js';
Router.post('/createPlan',async (req,res)=>{
    const {name , amount ,currency ,interval} = req.body; 
    try{
      const plan = await stripe.plans.create({
        amount,
        currency,
        interval,
        product: {
          name
        },
        nickname:name,
      });
      res.status(200).json(plan);
    
    }
    catch(err){
      res.status(500).json({error:err.message})
    }

})



Router.post('/createProduct',async (req,res)=>{
  try{
    const {name , type } = req.body; 
    const product = await stripe.products.create({
      name,
      type,
    });
    res.status(200).json(product);
  }
  catch(err){
    res.status(500).json({error:err.message})
  }

    
})
Router.post('/deletePlan',async (req,res)=>{
    try{
      const {planID} = req.body;
      const deletedPlan = await stripe.plans.del(planID);
      res.status(200).json(deletedPlan);
    }
    catch(err){
      res.status(500).json({error:err.message})
    }
})

Router.get('/listProduct',async (req,res)=>{
  try {
    const products = await stripe.products.list({
      limit: 20,
    });
    res.status(200).json(products);
  
  } catch (error) {
    res.status(500).json({error:error.message})
    
  }
})
Router.get('/listProductPlans',async (req,res)=>{
  try {
    
    const productID = req.query.productID;
    const plans = await stripe.plans.list({
      product: productID,
      limit: 20,
    });
    res.status(200).json(plans);
  
  } catch (error) {
    res.status(500).json({error:error.message})
    
  }

})

Router.get('/listPlan',async (req,res)=>{
  try{
    const plans = await stripe.plans.list({
      limit: 20,
    });
    res.status(200).json(plans);
  }
  catch(err){
    res.status(500).json({error:err.message})
  }
    
})

Router.post('/createSubscription', auth,async (req, res) => {
  try {
    const { planId ,business_id} = req.body; // customerId and planId are passed in the request body
    const user_id = req.user._id;
    const user = await User.findOne({_id:user_id});
    const business = await Business.findOne({_id:business_id});
    if(!business){
      return res.status(404).json({ message: "Business not found." });
    }
    if(!user){
      return res.status(404).json({ message: "User not found." });
    }
    
    
    const subscriptions = await stripe.subscriptions.list({
      customer: business.stripeCustomerId,
      status: "active",
    });

    if (subscriptions.data.length > 0) {
      // The customer already has an active subscription
      // Instead of creating a new session, return a message to alert the user
      return res.status(409).json({
        error:
          "You already have an active subscription. Please manage your subscription from the account settings.",
      });
    } else {
      // The customer does not have an active subscription
      // Create a new checkout session
      const session = await stripe.checkout.sessions.create({
        customer: business.stripeCustomerId,
        payment_method_types: ["card"],
        subscription_data: {
          items: [{ plan: planId }],
        },
        success_url: `http://localhost:3000/success`,
        cancel_url: "http://localhost:3000/cancel",
      });

      // Send the session ID as the response
      res.status(200).json({ session_url: session.url });
    }}
    catch(err){
      res.status(500).json({error:err.message})
    }
});



Router.get("/manage-subscription", async (req, res) => {
  if (req.session.user_email) {
    const email = req.session.user_email;
    const userRef = db.collection("users").doc(email);
    const userDoc = await userRef.get();
    const stripeCustomerId = userDoc.data().stripeCustomerId;
    if (stripeCustomerId) {
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: "http://localhost:3000/",
        // return_url: `${req.protocol}://${req.headers.host}`,
      });
      res.redirect(session.url);
    } else {
      res.status(404).send("No Stripe customer found for this user.");
    }
  } else {
    res.redirect("/login");
  }
});

export default Router;