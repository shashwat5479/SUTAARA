import { Router } from 'express';
import {
  getHeroSlides, getAllHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide,
  getExhibitionSlides, getAllExhibitionSlides, createExhibitionSlide, updateExhibitionSlide, deleteExhibitionSlide,
} from '../controllers/siteContentController.js';
import { protect, admin } from '../middleware/auth.js';

const router = Router();

// Hero
router.get('/hero', getHeroSlides);
router.get('/hero/all', protect, admin, getAllHeroSlides);
router.post('/hero', protect, admin, createHeroSlide);
router.put('/hero/:id', protect, admin, updateHeroSlide);
router.delete('/hero/:id', protect, admin, deleteHeroSlide);

// Exhibition
router.get('/exhibition', getExhibitionSlides);
router.get('/exhibition/all', protect, admin, getAllExhibitionSlides);
router.post('/exhibition', protect, admin, createExhibitionSlide);
router.put('/exhibition/:id', protect, admin, updateExhibitionSlide);
router.delete('/exhibition/:id', protect, admin, deleteExhibitionSlide);

export default router;
