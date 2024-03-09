import mongoose  from "mongoose";

const businessCallSchema = new mongoose.Schema({
    

  "name": {
    "type": "String",
    "required": true
  },
  "businessEntityName": {
    "type": "String",
    "required": true
  },
  "address": {
    "type": "String"
  },
  "emailId": {
    "type": "String"
  },
  "mobileNumber": {
    "type": "String",
    "required": true
  },
  "createdAt": {
    "type": "Date",
    "default": Date.now
  } ,

});

export default mongoose.model('BusinessCall', businessCallSchema);

