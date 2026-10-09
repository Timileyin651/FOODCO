const express = require('express');
const csrf = require('../middleware/csrf');
const authController = require('../controllers/authController');

/**
 * Pages for the EJS front end: login, logout and the password reset flow.
 * Every POST is CSRF protected.
 */
const webRouter = express.Router();

webRouter.get('/login', authController.showLogin);
webRouter.post('/login', csrf.verify, authController.login);
webRouter.post('/logout', csrf.verify, authController.logout);

webRouter.get('/forgot-password', authController.showForgot);
webRouter.post('/forgot-password', csrf.verify, authController.forgot);

webRouter.get('/reset-password/:token', authController.showReset);
webRouter.post('/reset-password/:token', csrf.verify, authController.resetPassword);

module.exports = webRouter;
