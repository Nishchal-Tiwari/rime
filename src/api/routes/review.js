import { Router } from 'express';
import { changePassword, deleteUser, editUser, forgotPassword, getUser, login, logout, refreshToken, register, sendVerificationCode, verifyEmail } from '../controllers/user/index.js';
import { auth, imageUpload } from '../middlewares/index.js';
import Business from '../../models/business.js';
import User from '../../models/user.js';
import review from '../../models/reviews.js';
import { BackendUrl } from '../../config/index.js';
const router = Router();

router.post('/', async (req,res)=>{
  try {
   
    const { business_id, starCount, textReview, platform } = req.body;
    if(!business_id) return res.status(404).json({ error: 'Business token not  found' });
    // Find the business by its _id
    const business = await Business.findOne({business_id: business_id});

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Create a new review
    const newReview = new review({
      business_id: business._id,
      starRating: starCount,
      customer_feedback:textReview,
      platform:platform
    });
    
    // Save the new review
    await newReview.save();

    // Push the review's _id into the business's reviews array
    business.reviews.push(newReview._id);

    // Save the updated business
    await business.save();
    let  redirectUrl = '/x2';
    if(platform==='google'){
      redirectUrl=`https://search.google.com/local/writereview?placeid=ChIJP0warDDowokRfvXMkBqL5Cg`
    }
    else if(platform==='facebook'){
      // redirectUrl=`https://www.facebook.com/${business.facebook_page_id}/reviews/`
      redirectUrl=`https://www.facebook.com/sharer/sharer.php?u=${BackendUrl}/api/business/myhotel/${business.business_id}`
    }
    else if(platform==='twitter'){
      redirectUrl=`https://twitter.com/intent/tweet?text=${textReview}&url=https://example.com&hashtags=#${business.name}`
    }
    else if(platform==='instagram'){
      //link to prefilled post with review
      redirectUrl = `https://www.instagram.com/${business.instagram_handle}/?hl=en`
    }
    else if(platform==='glassdoor'){
      redirectUrl = `https://www.glassdoor.com/Reviews/${business.glassdoor_handle}`
    }
    // Respond with the newly created review
   // res.status(201).json({ message: 'Review created and associated with the business', newReview });
   res.redirect(redirectUrl);
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