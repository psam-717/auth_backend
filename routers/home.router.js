const express = require('express');
const router = express.Router()

router.get('/profile', (req, res) => {
    res.status(200).json({success: true, message: `Welcome ${req.user.email} `, user: req.user});
})


module.exports = router;