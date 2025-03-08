const express = require('express');
const authController  = require('../controllers/authController');
const router = express.Router()

// note that each task performed has its own route
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.patch('/send_verification_code', authController.sendVerificationCode)

module.exports = router;