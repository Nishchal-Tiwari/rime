import { Router } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import { serve, setup } from 'swagger-ui-express';
import { specs, swaggerConfig } from '../../config/index.js';
import user from './user.js';
import business from './business.js';
import review from './review.js';
import payment from './payment.js';
const router = Router();

const specDoc = swaggerJsdoc(swaggerConfig);

router.use(specs, serve);
router.get(specs, setup(specDoc, { explorer: true }));

router.use('/user', user);
router.use('/business', business);
router.use('/review',review);
router.use('/payment', payment);
export default router;