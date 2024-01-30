import { Router } from 'express';
import { changePassword, deleteUser, editUser, forgotPassword, getUser, login, logout, refreshToken, register, sendVerificationCode, verifyEmail } from '../controllers/user/index.js';
import { auth, imageUpload } from '../middlewares/index.js';
import Business from '../../models/business.js';
import User from '../../models/user.js';
import review from '../../models/reviews.js';
const router = Router();

router.post('/', async (req,res)=>{
  try {
    console.log("thsi is body",req.body)
    const { business_id, starCount, textReview, forward_path } = req.body;
    if(!business_id) return res.status(404).json({ error: 'Business token not  found' });
    // Find the business by its _id
    const business = await Business.findOne({business_id: business_id});

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Create a new review
    const newReview = new review({
      business_id: business_id,
      starRating: starCount,
      customer_feedback:textReview,
    });
    newReview.review_posted_on.push(forward_path?forward_path:"No platform feedback available");
    // Save the new review
    await newReview.save();

    // Push the review's _id into the business's reviews array
    business.reviews.push(newReview._id);

    // Save the updated business
    await business.save();

    // Respond with the newly created review
    res.status(201).json({ message: 'Review created and associated with the business', newReview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
})



router.get('/',auth, async (req, res) => {
   const user_id = req.user._id;// Assuming the user_id is in the request parameters
   try{
      
      const user = await User.findById(user_id);
      if(!user){
        return res.status(404).json({ error: 'User not found' });
      }
      const reviews = await Business.findById(user.business_id).populate('reviews');
      if(!reviews){
        return res.status(404).json({ error: 'no review  found' });
      }
      
     
      if(!reviews){
        return res.status(404).json({ error: 'Reviews not found' });
      }
      res.status(200).json({reviews:reviews.reviews});
   }
   catch (error) {
      res.status(500).json({ error: error.message});
   }
})
export default router