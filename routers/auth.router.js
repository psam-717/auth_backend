const express = require('express');
const authController  = require('../controllers/authController');
const {authenticateToken } = require('../middlewares/identification');
const router = express.Router()

// note that each task performed has its own route
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authenticateToken ,authController.logout);
router.patch('/send_verification_code', authenticateToken ,authController.sendVerificationCode); 
router.patch('/verify_verification_code', authenticateToken ,authController.verifyVerificationCode);
router.get('/home', authenticateToken, authController.home);
router.patch('/change_password', authenticateToken, authController.changePassword);
router.patch('/send_forgot_password_code', authenticateToken, authController.sendForgotPasswordCode);
router.patch('/verify_forgot_password_code', authenticateToken, authController.verifyForgotPasswordCode);

module.exports = router;