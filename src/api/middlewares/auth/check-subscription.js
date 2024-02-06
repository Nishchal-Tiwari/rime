import Stripe from "stripe";
import { StripeApiKey } from "../../../config";



export default async (req,res)=>{
    const stripe = Stripe(StripeApiKey);
    const user_id = req.user._id;
    try {
        const user = await User.findById(user_id);
        if (!user || !user.stripeCustomerId) {
           next(req, res);
        }
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'active',
          limit: 1
      });
      if (subscriptions.data.length > 0) {
        req.hasActiveSubscriptions = true;
      }
      
      next(req, res);
    }
    catch (err) {
      console.log(err);
      next(req, res);
    }
}
