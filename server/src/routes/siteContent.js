import { Router } from 'express';
import {
  getHeroSlides, getAllHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide,
  getExhibitionSlides, getAllExhibitionSlides, createExhibitionSlide, updateExhibitionSlide, deleteExhibitionSlide,
  getCuratedEdits, getAllCuratedEdits, createCuratedEdit, updateCuratedEdit, deleteCuratedEdit,
  getAnnouncement, getAllAnnouncements, saveAnnouncement,
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

// Curated Edits (Sutaara Edits menu + page)
router.get('/edits', getCuratedEdits);
router.get('/edits/all', protect, admin, getAllCuratedEdits);
router.post('/edits', protect, admin, createCuratedEdit);
router.put('/edits/:id', protect, admin, updateCuratedEdit);
router.delete('/edits/:id', protect, admin, deleteCuratedEdit);

// Announcement bar
router.get('/announcement', getAnnouncement);
router.get('/announcement/all', protect, admin, getAllAnnouncements);
router.put('/announcement', protect, admin, saveAnnouncement);

export default router;
