import mongoose  from "mongoose";

const reviewSchema = new mongoose.Schema({
    business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
    review: { type:String, required: true },
});

export default mongoose.model('PrecompiledReview', reviewSchema);
