import { Router } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import { serve, setup } from 'swagger-ui-express';
import { specs, swaggerConfig } from '../../config/index.js';
import user from './user.js';
import business from './business.js';
import review from './review.js';
import payment from './payment.js';
import admin from './admin.js';
import metric from './metrics.js';
import { admin_auth } from '../middlewares/index.js';
const router = Router();

const specDoc = swaggerJsdoc(swaggerConfig);

router.use(specs, serve);
router.get(specs, setup(specDoc, { explorer: true }));

router.use('/user', user);
router.use('/business', business);
router.use('/review',review);
router.use('/payment', payment);
router.use('/metric', metric);
router.use('/admin',admin_auth, admin);
export default router;