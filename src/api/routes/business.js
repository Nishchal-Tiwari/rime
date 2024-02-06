import { Router } from 'express';
import {updatebusiness,
  deletebusiness,
  createbusiness,
  getAllBusinessesForUser,
  getBusinessInfoForReview,
  getCurrentBusiness,
  hotelfbview
} from '../controllers/business/index.js';
  import { auth, imageUpload } from '../middlewares/index.js';
import fs from 'fs';
  
const router = Router();
router.get('/myhotel/:bid', hotelfbview);
router.get('/',auth,getCurrentBusiness);
router.post("/qrbusiness_info",getBusinessInfoForReview)
// create hotel
router.post('/',auth, createbusiness);
router.delete('/', auth,deletebusiness);
router.put('/', auth,updatebusiness);

router.post('/img', auth, imageUpload, (req, res) => {
  if(req.file){
  // Write the file to the storage directory
  fs.writeFile(`./${uploadedFile.originalname}`, req.file.buffer, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error saving the file.' });
    }

  })
  return res.status(200).json({ success: 'File saved successfully.' });
  }
  return res.status(500).json({ error: 'File not saved.' });

  
})

export default router


