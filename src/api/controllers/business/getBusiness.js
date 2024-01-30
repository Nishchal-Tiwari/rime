import business  from "../../../models/business.js";
import generateQR  from '../../../utils/qrcode.js';
import randomNumber from '../../../utils/helpers/generate-random-code.js';
import mongoose from 'mongoose';
import User from '../../../models/user.js';
const getCurrentBusiness = async  (req, res) => {
  const user_id = req.user._id;// Assuming the user_id is in the request parameters
  try{
    const user  = await User.findOne({_id: user_id});
    const bsn =await business.findOne({_id:user.business_id});
    if(!bsn){
      return res.status(404).json({ error: 'Business not found' });
    }
    res.status(200).json(bsn);
  }
  catch(err){
    res.status(500).json({ error:err.message });
  }
}
export  {getCurrentBusiness};