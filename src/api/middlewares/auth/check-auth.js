import { User, Token } from "../../../models/index.js";
import { errorHelper } from "../../../utils/index.js";
import { jwtSecretKey } from "../../../config/index.js";
import pkg from "mongoose";
const { Types } = pkg;
import jwt from "jsonwebtoken";
const { verify } = jwt;

export default async (req, res, next) => {
  let token = req.header("Authorization");
  if (!token) return res.status(401).json(errorHelper("00006", req));
  if (token.includes("Bearer"))
    token = req.header("Authorization").replace("Bearer ", "");

  try {
    req.user = verify(token, jwtSecretKey);
    console.log(req.user);
    if (!Types.ObjectId.isValid(req.user._id))
      return res.status(400).json(errorHelper("00007", req));

    const exists = await User.exists({
      _id: req.user._id,
      isVerified: true,
      isActivated: true,
    }).catch((err) => {
      return res.status(500).json(errorHelper("00008", req, err.message));
    });
    console.log(exists);
    if (!exists) return res.status(400).json(errorHelper("00009", req));

    const tokenExists = await Token.exists({
      userId: req.user._id,
      status: true,
    }).catch((err) => {
      return res.status(500).json(errorHelper("00010", req, err.message));
    });

    if (!tokenExists) return res.status(401).json(errorHelper("00011", req));
    // Check for Business and its Active Subscription on Stripe
    const user = await User.findById(req.user._id).catch((err) => {
      return res.status(500).json(errorHelper("00008", req, err.message));
    });
    if (user.businessId) {
      const business = await Business.findById(user.businessId);
      if (business && business.stripeCustomerId) {
        const subscriptions = await stripe.subscriptions.list({
          customer: business.stripeCustomerId,
          status: "active",
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          req.subscriptionDetails = subscriptions.data[0]; // Add active subscription details to request
        }
      }
    }
    next();
  } catch (err) {
    return res.status(401).json(errorHelper("00012", req, err.message));
  }
};
