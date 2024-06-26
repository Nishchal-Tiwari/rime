import { User } from '../../../../models/index.js';
import { validateRegister } from '../../../validators/user.validator.js';
import { errorHelper, generateRandomCode, sendCodeToEmail, logger, getText, turkishToEnglish, signConfirmCodeToken } from '../../../../utils/index.js';
import ipHelper from '../../../../utils/helpers/ip-helper.js';
import bcrypt from 'bcryptjs';
const { hash } = bcrypt;
import geoip from 'geoip-lite';
const { lookup } = geoip;
import { BackendUrl } from '../../../../config/index.js';
import Stripe from 'stripe';
import { StripeApiKey } from '../../../../config/index.js';
const stripe = Stripe(StripeApiKey)


export default async (req, res) => {
  req.body.timezone=parseInt(req.body.timezone);
  const { error } = validateRegister(req.body);
  if (error) {
    return res.status(400).json(error.message);
  }
try{
      const exists = await User.exists({ email: req.body.email })
      .catch((err) => {
        return res.status(500).json(errorHelper('00031', req, err.message));
      });

      if (exists) return res.status(409).json(errorHelper('00032', req));

      const hashed = await hash(req.body.password, 10);


      let username = '';
      let tempName = '';
      let existsUsername = true;
      let name = req.body.name
      if (name.includes(' ')) {
        tempName = name.trim().split(' ').slice(0, 1).join('').toLowerCase();
      } else {
        tempName = name.toLowerCase().trim();
      }
      do {
        username = tempName + generateRandomCode(4);
        existsUsername = await User.exists({ username: username }).catch((err) => {
          return res.status(500).json(errorHelper('00033', req, err.message));
        });
      } while (existsUsername);

      const geo = lookup(ipHelper(req));
      let type =  req.body.type;
      type=type?type.toLowerCase():'user';
      const customer = await stripe.customers.create({
        email: req.body.email,
        name:name,
      });
      let user = new User({
        email: req.body.email,
        password: hashed,
        name: name,
        username: username,
        language: req.body.language,
        platform: req.body.platform,
        isVerified: false,
        countryCode: geo == null ? 'IN' : geo.country,
        timezone: req.body.timezone,
        lastLogin: Date.now(),
        isVerified:true,
        type,
        stripeCustomerId: customer.id
      });

      user = await user.save().catch((err) => {
        return res.status(500).json({error: err.message});
      });

      user.password = null;

      const confirmCodeToken = signConfirmCodeToken(user._id, 123);
      const generatedLink = `${BackendUrl}/api/user/verifymail?token=${confirmCodeToken}`
      sendCodeToEmail(req.body.email,generatedLink ,req.body.name );

      logger('00035', user._id, getText('en', '00035'), 'Info', req);
      return res.status(200).json({
        message:  getText('en', '00035'),
        resultCode: '00035', user, confirmToken: confirmCodeToken
      });}
      catch(err){
        console.log(err);
        res.status(500).json({error:err.message});
      }
};

/**
 * @swagger
 * /user:
 *    post:
 *      summary: Registers the user
 *      requestBody:
 *        description: All required information about the user
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                password:
 *                  type: string
 *                name:
 *                  type: string
 *                language:
 *                  type: string
 *                  enum: ['tr', 'en']
 *                platform:
 *                  type: string
 *                  enum: ['Android', 'IOS']
 *                timezone:
 *                  type: number
 *                deviceId:
 *                  type: string
 *      tags:
 *        - User
 *      responses:
 *        "200":
 *          description: You registered successfully.
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          resultMessage:
 *                              $ref: '#/components/schemas/ResultMessage'
 *                          resultCode:
 *                              $ref: '#/components/schemas/ResultCode'
 *                          user:
 *                              $ref: '#/components/schemas/User'
 *                          confirmToken:
 *                              type: string
 *        "400":
 *          description: Please provide all the required fields!
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/Result'
 *        "500":
 *          description: An internal server error occurred, please try again.
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/Result'
 */