import { Router } from 'express';
import { auth } from '../middlewares/index.js';
import {User,Business,Subscription,Review} from '../../models/index.js'
const router = Router();
import Stripe from 'stripe';
import { StripeApiKey } from '../../config/index.js';
const stripe = Stripe(StripeApiKey)
// Get all users

//get total number of reviews 
router.get('/',auth, async (req, res) => {
  const user_id = req.user._id;
  try {
    const user = await User.findById(user_id);
    const bid = user.business_id;
    // Today's date at 00:00:00
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Start of the current week (assuming Monday as the first day of the week)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Adjust accordingly if your week starts on a different day
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const totalReviews = await Review.countDocuments({  business_id:bid});
    // Query reviews for each time frame
   const totalReviewsToday = await Review.countDocuments({
      creation_date: { $gte: startOfToday },
      business_id:bid
    });

    const totalReviewsThisWeek = await Review.countDocuments({
      creation_date: { $gte: startOfWeek },
      business_id:bid
    });

    const totalReviewsThisMonth = await Review.countDocuments({
      creation_date: { $gte: startOfMonth },
      business_id:bid
    });
 

    const fiveStarReviews = await Review.countDocuments({ starRating: 5, business_id:bid });
    const fourStarReviews = await Review.countDocuments({ starRating: 4, business_id:bid });
    const threeStarReviews = await Review.countDocuments({ starRating: 3, business_id:bid });
    const twoStarReviews = await Review.countDocuments({ starRating: 2, business_id:bid });
    const oneStarReviews = await Review.countDocuments({ starRating: 1, business_id:bid });

    res.status(200).json({
      totalReviews,
      totalReviewsToday,
      totalReviewsThisWeek,
      totalReviewsThisMonth,
      fiveStarReviews,
      fourStarReviews,
      threeStarReviews,
      twoStarReviews,
      oneStarReviews
        
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reviews/week', auth, async (req, res) => {
  const user_id = req.user._id;
  try {
    const user = await User.findById(user_id);
    const bid = user.business_id;
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const reviewsThisWeek = await Review.aggregate([
      {
        $match: {
          creation_date: { $gte: startOfWeek, $lt: endOfWeek },
          business_id: bid
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$creation_date" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    // Initialize an array for all days of the week with count 0
    let reviewsCountByDay = [];
    for (let i = 1; i <= 7; i++) { // Assuming 1 is Monday and 7 is Sunday
      reviewsCountByDay.push({ day: i, count: 0 });
    }

    // Update counts for days with reviews
    reviewsThisWeek.forEach(review => {
      const dayOfWeek = review._id;
      reviewsCountByDay[dayOfWeek - 1].count = review.count;
    });

    res.status(200).json(reviewsCountByDay);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});router.get('/reviews/month', auth, async (req, res) => {
  const user_id = req.user._id;
  try {
    const user = await User.findById(user_id);
    const bid = user.business_id;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const nextMonth = new Date(startOfMonth);
    nextMonth.setMonth(startOfMonth.getMonth() + 1);

    const daysInMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0).getDate();

    const reviewsThisMonth = await Review.aggregate([
      {
        $match: {
          creation_date: { $gte: startOfMonth, $lt: nextMonth },
          business_id: bid
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: "$creation_date" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    // Initialize an array for all days of the month with count 0
    let reviewsCountByDay = [];
    for (let i = 1; i <= daysInMonth; i++) {
      reviewsCountByDay.push({ day: i, count: 0 });
    }

    // Update counts for days with reviews
    reviewsThisMonth.forEach(review => {
      const dayOfMonth = review._id;
      if (reviewsCountByDay[dayOfMonth - 1]) {
        reviewsCountByDay[dayOfMonth - 1].count = review.count;
      }
    });

    res.status(200).json(reviewsCountByDay);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.get('/reviews/week/average', auth, async (req, res) => {
  const user_id = req.user._id;
  try {
    const user = await User.findById(user_id);
    const bid = user.business_id;
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const averageReviewsThisWeek = await Review.aggregate([
      {
        $match: {
          creation_date: { $gte: startOfWeek, $lt: endOfWeek },
          business_id: bid
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$creation_date" },
          averageRating: { $avg: "$starRating" }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    // Initialize an array for all days of the week with averageRating as null or 0
    let averageRatingByDay = [];
    for (let i = 1; i <= 7; i++) { // Assuming 1 is Monday and 7 is Sunday
      averageRatingByDay.push({ day: i, averageRating: null }); // or use 0 instead of null
    }

    // Update averageRating for days with reviews
    averageReviewsThisWeek.forEach(review => {
      const dayOfWeek = review._id;
      averageRatingByDay[dayOfWeek - 1].averageRating = review.averageRating;
    });

    res.status(200).json(averageRatingByDay);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



export default router


