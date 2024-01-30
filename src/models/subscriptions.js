import mongoose  from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscription_id: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    name: { type: String, required: true },
    price: Number,
    duration: String,
    features: [String]
});

export default mongoose.model('Subscription', subscriptionSchema);
