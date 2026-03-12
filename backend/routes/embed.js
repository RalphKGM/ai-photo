import express from 'express';
import { generateEmbeddingController } from '../controller/embedding.controller.js';

const router = express.Router();


router.post('/embed', generateEmbeddingController);

export default router;
