import express from 'express';
import { getAllPhotosController, searchImagesController } from '../controller/photo.controller.js';

const router = express.Router();

router.post('/search', searchImagesController);
router.get('/photos', getAllPhotosController);

export default router;
