import {User,Token} from '../../../models/index.js';
import { errorHelper } from '../../../utils/index.js';
import { jwtSecretKey } from '../../../config/index.js';
import pkg from 'mongoose';
const { Types } = pkg;
import jwt from 'jsonwebtoken';
const { verify } = jwt;
export default async (req, res) => {
  let token = req.header("Authorization");
  if (!token) return res.status(401).json({ error:"Invalid token"});

  if (token.includes("Bearer"))
    token = req.header("Authorization").replace("Bearer ", "");

  try {
    req.user = verify(token, jwtSecretKey);

    if (!Types.ObjectId.isValid(req.user._id))
      return res.status(400).json({  error:"Token Expired" });

    const exists = await User.exists({
      _id: req.user._id,
      isVerified: true,
      isActivated: true,
    }).catch((err) => {
      return res.status(500).json({ error: err.message });
    });

    if (!exists) return res.status(400).json({ error: "Invalid User" });

    const tokenExists = await Token.exists({
      userId: req.user._id,
      status: true,
    }).catch((err) => {
      return res.status(500).json({error:"Session Expired"});
    });

    if (!tokenExists) return res.status(401).json(errorHelper("00011", req));
   const user= await User.findById(req.user._id);
   user.password=null;
 
    res.status(200).json(user);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
};
