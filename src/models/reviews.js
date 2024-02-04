import mongoose  from "mongoose";

const reviewSchema = new mongoose.Schema({
    business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
    customer_feedback: String,
    generated_review: String,
    platform: {type:String, enum:['google', 'glassdoor','instagram','facebook','twitter',],default: 'google'},
    creation_date: { type: Date, default: Date.now },
    starRating: { type: Number, min: 0, max: 5 },
    forward_path: { type: String, default: null },
});

export default mongoose.model('Review', reviewSchema);
