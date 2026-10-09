const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const csrf = require('../middleware/csrf');
const dashboardController = require('../controllers/dashboardController');
const itemController = require('../controllers/itemController');
const auditController = require('../controllers/auditController');

/**
 * The whole dashboard requires a logged-in session (requireAuth applied to the
 * router). Routes are declared before the generic :module matcher:
 *   /dashboard           overview
 *   /dashboard/audit     read-only audit trail
 *   /dashboard/:module   list, create, edit, delete (Bakery / Pastries / Snacks)
 */
const dashboardRouter = express.Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/', dashboardController.overview);
dashboardRouter.get('/audit', auditController.list);

dashboardRouter.get('/:module', itemController.list);

dashboardRouter.get('/:module/new', itemController.createForm);
dashboardRouter.post('/:module/new', csrf.verify, itemController.create);

dashboardRouter.get('/:module/:id/edit', itemController.editForm);
dashboardRouter.post('/:module/:id/edit', csrf.verify, itemController.edit);

dashboardRouter.post('/:module/:id/delete', csrf.verify, itemController.remove);

module.exports = dashboardRouter;
