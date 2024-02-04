import mongooseLoader from './mongoose.js';
import expressLoader from './express.js';
import stripeLoader from './stripe.js';
export default async (app) => {
  await mongooseLoader();
  expressLoader(app);
  stripeLoader();
}