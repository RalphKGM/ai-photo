import express from 'express';
import multer from 'multer';
import {
    batchProcessImagesController,
    deletePhotoController,
    getPhotoController,
    processImageController,
    reprocessImageController,
    updatePhotoDescriptionsController,
} from '../controller/photo.controller.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
    storage, 
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/image', upload.single('image'), processImageController);
router.post('/images/batch', upload.array('images', 50), batchProcessImagesController);
router.delete('/photo/:id', deletePhotoController);
router.get('/photo/:id', getPhotoController);
router.patch('/photo/:id/descriptions', updatePhotoDescriptionsController);
router.post('/photo/:id/reprocess', upload.single('image'), reprocessImageController);

export default router;
