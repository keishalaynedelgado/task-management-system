const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All tenant routes require authentication
router.use(authMiddleware);

// Listing tenants is needed by admins too (e.g. tenant selector in User Management)
router.get('/', authorize('super_admin', 'admin'), tenantController.getAllTenants);
router.get('/:id', authorize('super_admin', 'admin'), tenantController.getTenantById);

// Creating/updating/deleting tenants remains super admin only
router.post('/', authorize('super_admin'), validate(schemas.createTenant), tenantController.createTenant);
router.put('/:id', authorize('super_admin'), validate(schemas.updateTenant), tenantController.updateTenant);
router.delete('/:id', authorize('super_admin'), tenantController.deleteTenant);

module.exports = router;