import mongoose  from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    metaid: {type: 'string', required: true, unique: true},
    priceId: { type: String, required: true, unique: true },
    productId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: Number,
    currency: String,
    interval: String,
    trialDays: Number,
    features: [String],
    
});

export default mongoose.model('Subscription', subscriptionSchema);
