import mongoose from "mongoose";

const businessSchema = new mongoose.Schema({
  business_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  name: { type: String, required: true },
  location: String,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
  },
  active_subscription: { type: Boolean, default: false },
  location: { type: String, required: true },
  description: { type: String },
  customAIDescription: { type: String, default: null },
  // active_subscription_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ActiveSubscriptions' },
  qr_code: String,
  place_id: { type: String, default: null },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  facebook_id: { type: String, default: null },
  glassdoor_id: { type: String, default: null },
  instagram_id: { type: String, default: null },
  x_id: { type: String, default: null },
  stripeCustomerId: { type: String, default: null },
  room: { type: String, default: null },
  slogan: { type: String, default: null },
  activePlatforms: [
    {
      type: String,
      enum: ["google", "glassdoor", "instagram", "facebook", "twitter"],
      default: "google",
    },
  ],
  activeAI: { type: String, default: "chatgpt3.5" },
  isActive: { type: Boolean, default: true },
});

export default mongoose.model("Business", businessSchema);
