import express from 'express';
import business from '../models/business.js';
import User from '../models/user.js';
import generateAIReviews from  '../utils/ai/index.js';
import PrecompiledReview from '../models/precompiledReviews.js';
const router = express.Router();
import mongoose from 'mongoose';
import Stripe from 'stripe';
import { StripeApiKey } from '../config/index.js';
const stripe = Stripe(StripeApiKey);
router.get('/feedback',async  function (req, res){
  const business_id = req.query.business_id;
  console.log(business_id);
  if(!mongoose.Types.ObjectId.isValid(business_id)|| business ==null){
    return res.render('nohotelfound');
  }
  try {
    const bn = await business.findOne({business_id: business_id}).populate('precompiledReviews');
   
    
    if(!bn){
      return res.render('nohotelfound');
    }
    const business_description = bn.description
    const business_name = bn.name
    const business_location = bn.location
    const business_customAIDescription = bn.customAIDescription
    const business_place_id = bn.place_id
    const facebook_id = bn.facebook_id
    const instagram_id = bn.instagram_id
    const x_id = bn.x_id
    const activePlatforms=bn.activePlatforms
    const activeAI=bn.activeAI

  //  const generated = await generateAIReviews(business_description,business_customAIDescription,business_name,activeAI);
  
  const generatedd={
    '1star': {
      review1: {
        summary: 'Not worth the money',
        review: 'I stayed at this hotel and I was really disappointed. The room was not clean and the amenities were outdated. Definitely not worth the money.'
      },
      review2: {
        summary: 'Terrible service',
        review: 'The service at this hotel is extremely poor. The staff are rude and unhelpful. I would not recommend staying here.'
      },
      review3: {
        summary: 'Dirty and uncomfortable',
        review: "The room I stayed in was dirty and uncomfortable. The sheets were stained and the bed was really uncomfortable. I couldn't sleep properly during my stay."
      },
      review4: {
        summary: 'Overpriced and overrated',
        review: 'I expected a luxurious experience at this hotel, but it was far from it. The price I paid was way too high for the quality of service and amenities provided. Definitely overpriced and overrated.'
      },
      review5: {
        summary: 'Avoid this hotel',
        review: 'I had a terrible experience at this hotel. The room was tiny and the noise from outside was unbearable. The hotel staff were not friendly at all. I would not recommend staying here.'
      }
    },
    '2star': {
      review1: {
        summary: 'Average at best',
        review: 'This hotel is just average. The room was clean but the service was mediocre. I expected more for the price I paid.'
      },
      review2: {
        summary: 'Decent hotel with some flaws',
        review: 'The hotel is decent overall, but there were a few flaws. The bathroom was not properly cleaned and the Wi-Fi was unreliable. It was an okay stay, nothing exceptional.'
      },
      review3: {
        summary: 'Could be better',
        review: 'There is definitely room for improvement at this hotel. The room was spacious but the furniture was outdated. The breakfast buffet was average at best.'
      },
      review4: {
        summary: 'Not impressed',
        review: "I was not impressed with this hotel. The customer service was slow and the food at the restaurant was below average. I don't think I will stay here again."
      },
      review5: {
        summary: 'Not a five-star experience',
        review: 'This hotel claims to be a five-star hotel, but it fell short of my expectations. The room was clean but the facilities were not top-notch. I would rate it as a two-star hotel at best.'
      }
    },
    '3star': {
      review1: {
        summary: 'Decent stay for the price',
        review: 'I had a decent stay at this hotel considering the price I paid. The room was clean and the staff were friendly. However, the breakfast options were limited.'
      },
      review2: {
        summary: 'Not bad, not great',
        review: "My stay at this hotel was average. The room was comfortable but the service was not exceptional. It's a decent option if you're looking for a mid-range hotel."
      },
      review3: {
        summary: 'Satisfactory',
        review: 'Overall, I was satisfied with my stay at this hotel. The room was clean and the staff were polite. However, there were a few minor issues that could have been better.'
      },
      review4: {
        summary: 'Average experience',
        review: "This hotel provides an average experience. The room was clean but the amenities were not impressive. It's an okay place to stay if you're not expecting anything extraordinary." 
      },
      review5: {
        summary: 'Decent hotel for a short stay',
        review: 'I stayed at this hotel for a night and it was a decent experience. The room was clean and comfortable. The location is convenient and the staff were helpful.'
      }
    },
    '4star': {
      review1: {
        summary: 'Great hotel with minor flaws',
        review: 'Overall, this is a great hotel with excellent service. The room was spacious and clean, but there were a few minor flaws like a leaky faucet in the bathroom. Still, I would recommend staying here.'
      },
      review2: {
        summary: 'Good value for money',
        review: 'I had a pleasant stay at this hotel. The room was comfortable and the service was good. The price I paid was reasonable for the quality of the hotel.'
      },
      review3: {
        summary: 'Almost perfect',
        review: 'This hotel is almost perfect. The room was clean and stylish, and the staff were friendly and accommodating. The only downside was the slow Wi-Fi.'
      },
      review4: {
        summary: 'Impressed with the facilities',
        review: 'I was impressed with the facilities at this hotel. The gym and swimming pool were well-maintained. The room was comfortable and the service was excellent.'
      },
      review5: {
        summary: 'Highly recommended',
        review: 'I highly recommend this hotel. The room was luxurious and the staff went above and beyond to make my stay comfortable. The food at the restaurant was also delicious.'
      }
    },
    '5star': {
      review1: {
        summary: 'Luxurious and top-notch',
        review: 'This hotel is truly luxurious and top-notch. The rooms are spacious and beautifully designed. The staff are attentive and the service is impeccable.'
      },
      review2: {
        summary: 'Exceptional experience',
        review: 'I had an exceptional experience at this hotel. The room was stunning and the amenities were unparalleled. The staff anticipate your needs and provide excellent service.'        
      },
      review3: {
        summary: 'Best hotel in Ludhiana',
        review: 'This is the best hotel in Ludhiana. The rooms are elegant and the facilities are world-class. The staff treat you like royalty. I will definitely be back.'
      },
      review4: {
        summary: 'Luxury at its finest',
        review: "If you're looking for luxury, this is the hotel to stay at. The rooms are beautifully furnished and the service is exceptional. Every detail is taken care of."
      },
      review5: {
        summary: 'Unforgettable experience',
        review: 'My stay at this hotel was truly unforgettable. From the moment I arrived, I was treated like a VIP. The room was exquisite and the staff went above and beyond to ensure my comfort.'
      }
    }
  }
  let generated=null;
  const subs=await findIfBusinessHasActiveSubscriptions(bn.user_id);
  console.log(subs?"activesubs":"nosubscription");
  if(subs){
    generatePrecompiledReviews(bn.id);
  }
  if(bn.precompiledReviews.length>0&&subs){
    generated=JSON.parse(bn.precompiledReviews[0].review);
    // delete this review from precompiledreviews
    await PrecompiledReview.findByIdAndDelete(bn.precompiledReviews[0]._id);
  }
  else{
    generated=generatedd;
  }
    
      res.render('index',{data:{
        generated,
        business_id,
        business_description,
        business_name,
        business_location,
        business_customAIDescription,
        business_place_id,
        facebook_id,
        instagram_id,
        x_id,
        activePlatforms
        
      }});
  }
  catch(err){
    res.status(500).json({ error: err.message });
  }
})

async function findIfBusinessHasActiveSubscriptions(uid){
  const user = await User.findById(uid);
  if (!user || !user.stripeCustomerId) {
    return false;
  }
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 1
  });
  if (subscriptions.data.length > 0) {
  return true;
  }
  return false;
}

async function generatePrecompiledReviews(id) {
  try {
    const b = await business.findById(id);
    console.log(b.name,'+++++++++++++++++++++++++++++++',id)
    if (!b) {
      return null;
    }
    for (var i = 0; i < 1; i++) {
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
  //  await b.save();
  } catch (err) {
    console.error(err);
  }
}

export default router;