import express from 'express';
import {
  addPhotosToAlbumController,
  createAlbumController,
  getAlbumsController,
} from '../controller/albumController.js';

const router = express.Router();

router.get('/albums', getAlbumsController);
router.post('/albums', createAlbumController);
router.post('/albums/:id/photos', addPhotosToAlbumController);

export default router;
