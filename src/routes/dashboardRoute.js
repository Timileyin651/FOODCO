const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireBranch = require('../middleware/requireBranch');
const csrf = require('../middleware/csrf');
const branchController = require('../controllers/branchController');
const dashboardController = require('../controllers/dashboardController');
const itemController = require('../controllers/itemController');
const auditController = require('../controllers/auditController');

/**
 * Every dashboard page lives under one branch:
 *   /dashboard                     branch picker (or redirect to your branch)
 *   /dashboard/:branch             that branch's overview
 *   /dashboard/:branch/audit       its audit trail
 *   /dashboard/:branch/:module     list / create / edit / delete
 * requireAuth guards the router; requireBranch resolves + authorises :branch.
 */
const dashboardRouter = express.Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/', branchController.home);

dashboardRouter.get('/:branch', requireBranch, dashboardController.overview);
dashboardRouter.get('/:branch/audit', requireBranch, auditController.list);

dashboardRouter.get('/:branch/:module', requireBranch, itemController.list);

dashboardRouter.get('/:branch/:module/new', requireBranch, itemController.createForm);
dashboardRouter.post('/:branch/:module/new', requireBranch, csrf.verify, itemController.create);

dashboardRouter.get('/:branch/:module/:id/edit', requireBranch, itemController.editForm);
dashboardRouter.post('/:branch/:module/:id/edit', requireBranch, csrf.verify, itemController.edit);

dashboardRouter.post('/:branch/:module/:id/delete', requireBranch, csrf.verify, itemController.remove);

module.exports = dashboardRouter;
