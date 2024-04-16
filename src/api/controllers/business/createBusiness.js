import business from "../../../models/business.js";
import generateQR from "../../../utils/qrcode.js";
import randomNumber from "../../../utils/helpers/generate-random-code.js";
import mongoose from "mongoose";
import User from "../../../models/user.js";
import Stripe from "stripe";
import { StripeApiKey } from "../../../config/index.js";
import { generate } from "randomstring";
import PrecompiledReview from "../../../models/precompiledReviews.js";
import generateAIReviews from "../../../utils/ai/index.js";
const stripe = Stripe(StripeApiKey);

const createbusiness = async (req, res) => {
  const {
    name,
    location,
    customAIDescription = null,
    description = null,
    place_id = null,
    facebook_id = null,
    instagram_id = null,
    x_id = null,
    room = null,
    slogan = null,
  } = req.body;
  const user_id = req.user._id;
  const user = await User.findOne({ _id: user_id });
  if (user.business_id) {
    return res.status(400).json({ message: "User already has a business." });
  }
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  try {
    // Generate a QR code for the business
    const business_id = mongoose.Types.ObjectId();

    // Create a new business
    const newbusiness = new business({
      business_id: business_id,
      name,
      location,
      description,
      customAIDescription,
      user_id,
      place_id,
      stripeCustomerId: null,
      facebook_id,
      instagram_id,
      slogan,
      room,
      x_id,
      activePlatforms: [
        "google",
        "facebook",
        "instagram",
        "glassdoor",
        "twitter",
      ],
    });
    const savedbusiness = await newbusiness.save();
    generatePrecompiledReviews(savedbusiness.id);
    await User.findByIdAndUpdate(user_id, {
      $push: { business_ids: savedbusiness._id },
      $set: { business_id: savedbusiness._id },
    });

    // Save the business
    res.status(201).json(savedbusiness);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getAllBusinessesForUser = async (req, res) => {
  const user_id = req.user._id; // Assuming the user_id is in the request parameters

  try {
    // Find the user by their user_id and populate the 'business_ids' field
    const user = await User.findById(user_id).populate("business_ids");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract the businesses from the populated 'business_ids' field
    const businesses = user.business_ids;

    res.status(200).json({ businesses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
const getBusinessInfoForReview = async (req, res) => {
  try {
    const { business_id } = req.body;
    const b = await business.find({ business_id: business_id });
    if (!b) {
      return res.status(404).json({ error: "Business not found" });
    }
    res.status(200).json({
      businessinfo: {
        name: b[0]?.name,
        description: b[0]?.description,
        customAIDescription: b[0]?.customAIDescription,
        location: b[0]?.location,
        place_id: b[0]?.place_id,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const hotelfbview = async (req, res) => {
  const bid = req.params.bid;
  try {
    const b = await business.find({ business_id: bid });
    if (!b) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.render("hotelfbshare", {
      data: {
        description: b[0]?.description,
        name: b[0]?.name,
        location: b[0]?.location,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function generatePrecompiledReviews(bid) {
  try {
    const b = await business.findById(bid);
      if (!b) {
        return null;
      }
    // 10 free reviews
    for (var i = 0; i < 10; i++) {
      
      console.log("starting", i);
      const reviews = await generateAIReviews(
        b.description,
        b.customAIDescription,
        b.name,
        b.activeAI
      );
      const precompiledReviews = new PrecompiledReview({
        business_id: b.business_id,
        review: JSON.stringify(reviews),
      });
      const saved = await precompiledReviews.save();
      await business.findOneAndUpdate({business_id: b.business_id},{
        $push: { precompiledReviews: saved._id }
      });
      console.log("done ",i);
    }
    await b.save();
  } catch (err) {
    console.error(err);
  }
}
export {
  createbusiness,
  getAllBusinessesForUser,
  getBusinessInfoForReview,
  hotelfbview,
};

// async function checkStripeSubs(){
//   const subscriptions = await stripe.subscriptions.list({
//           customer: stripeCustomerId,
//           status: "active",
//         });

//         if (subscriptions.data.length > 0) {
//           //       // The customer already has an active subscription
//         }
//         else{
//           //       // The customer does not have an active subscription
//         }

//       }
//     async function updateCustomer(){
//       const customer = await stripe.customers.update(
//         'cus_NffrFeUfNV2Hib',
//         {
//           metadata: {
//             order_id: '6735',
//           },
//         }
//       );
//     }

//get a customer

// const customer = await stripe.customers.retrieve('cus_NffrFeUfNV2Hib');

//get all customers

// const customers = await stripe.customers.list({
//   limit: 3,
// });

//delete a customer

// const deleted = await stripe.customers.del('cus_NffrFeUfNV2Hib');

//search for a customer
// const customers = await stripe.customers.search({
//   query: 'name:\'Jane Doe\' AND metadata[\'foo\']:\'bar\'',
// });

//payments

// const paymentIntent = await stripe.paymentIntents.create({
//   amount: 2000,
//   currency: 'usd',
//   automatic_payment_methods: {
//     enabled: true,
//   },
// });

//rertive payment intent
// const paymentIntent = await stripe.paymentIntents.retrieve(
//   'pi_3MtwBwLkdIwHu7ix28a3tqPa'
// );
//list all payment intent

// const paymentIntents = await stripe.paymentIntents.list({
//   limit: 3,
// });

// const paymentIntent = await stripe.paymentIntents.confirm(
//   'pi_3MtweELkdIwHu7ix0Dt0gF2H',
//   {
//     payment_method: 'pm_card_visa',
//     return_url: 'https://www.example.com',
//   }
// );

//refund
// const refund = await stripe.refunds.create({
//   charge: 'ch_1NirD82eZvKYlo2CIvbtLWuY',
// });

//retrive refund
// const refund = await stripe.refunds.retrieve('re_1Nispe2eZvKYlo2Cd31jOCgZ');

// //list all refunds
// const refunds = await stripe.refunds.list({
//   limit: 3,
// });

//cancel a refund
// const refund = await stripe.refunds.cancel('re_1Nispe2eZvKYlo2Cd31jOCgZ');

//create price
// https://stripe.com/docs/api/prices/update

//create a price
// const price = await stripe.prices.create({
//   currency: 'usd',
//   unit_amount: 1000,
//   recurring: {
//     interval: 'month',
//   },
//   product_data: {
//     name: 'Gold Plan',
//   },
// });
//get allprices
// const prices = await stripe.prices.list({
//   limit: 3,
// });

// subscriptions
// const subscription = await stripe.subscriptions.create({
//   customer: 'cus_Na6dX7aXxi11N4',
//   items: [
//     {
//       price: 'price_1MowQULkdIwHu7ixraBm864M',
//     },
//   ],
// });

//retrive a subscription
// const subscription = await stripe.subscriptions.retrieve(
//   'sub_1MowQVLkdIwHu7ixeRlqHVzs'
// );

//lsit alll subs
// const subscriptions = await stripe.subscriptions.list({
//   limit: 3,
// });
