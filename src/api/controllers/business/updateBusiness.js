import {User,Business} from "../../../models/index.js"
const updatebusiness = async (req, res) => {
  
  try{
    const user_id = req.user._id;
        const user = await User.findById(user_id);
        if(!user){
        return res.status(404).json({ error: 'User not found' });
        }
        const business_id = user.business_id;
        const business = await Business.findById(business_id);
        if(!business){
        return res.status(404).json({ error: 'Business not found' });
        }
        const {name=business.name,description=business.description,customAIDescription=business.customAIDescription,location=business.location,place_id=business.place_id,facebook_id=business.facebook_id,instagram_id=business.instagram_id,x_id=business.x_id} = req.body;
        const updatedbusiness = await Business.findByIdAndUpdate(business_id,{
          name,
          description,
          customAIDescription,
          location,
          place_id
        },{new:true});
        res.status(200).json({message:"business updated sucessfully",business:updatedbusiness});
  }
  catch(err) {
    res.status(500).json({ error: err.message });
  }
};

export  default updatebusiness;
