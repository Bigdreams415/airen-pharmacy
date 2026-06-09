// server/src/routes/pharmacyRoutes.ts

import { Router } from 'express';
import { PharmacyController } from '../controllers/pharmacyController';

const router = Router();
const pharmacyController = new PharmacyController();

// GET /api/pharmacies - Get all pharmacies
router.get('/', pharmacyController.getAllPharmacies);

// GET /api/pharmacies/count - Get pharmacy count
router.get('/count', pharmacyController.getPharmacyCount);

// GET /api/pharmacies/:id - Get pharmacy by ID
router.get('/:id', pharmacyController.getPharmacyById);

// POST /api/pharmacies - Create new pharmacy
router.post('/', pharmacyController.createPharmacy);

// PUT /api/pharmacies/:id - Update pharmacy
router.put('/:id', pharmacyController.updatePharmacy);

// DELETE /api/pharmacies/:id - Delete pharmacy
router.delete('/:id', pharmacyController.deletePharmacy);

// OPTIONAL: Hard delete pharmacy (use with caution)
router.delete('/:id/hard', pharmacyController.hardDeletePharmacy);

export default router;