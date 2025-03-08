require('dotenv').config();
const jwt = require('jsonwebtoken');
const { signupSchema, signinSchema } = require("../middlewares/validator.js");
const User = require("../models/users.models.js");
const { comparingPassword } = require("../utils/compare.password.js");
const { hashPassword } = require("../utils/hashing.js");
const transport = require('../middlewares/sendMail.js');
const generateVerificationCode = require('../utils/verification.code.js');
const { hmacProcess } = require('../utils/hmac.js');

exports.signup = async (req, res) => {
    const {email, password} = req.body;
    try {
        const {error, value} = signupSchema.validate(req.body);

        if (error){
            return res.status(401).json({success: false, message: error.details[0].message});
        }

        // if the user already exists
        const existingUser = await User.findOne({email});
        if (existingUser){
            return res.status(401).json({success: false, message: 'User already exists'});
        }

        const hashed_Password = await hashPassword(password);
        const newUser = new User({
            email,
            password: hashed_Password
        })

        const result = await newUser.save();
        res.status(201)
            .json({success: true, message: 'Your account has been created successfully', result});

    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

exports.login = async (req, res) => {
    const {email, password} = req.body;
    
    try {
        const {error, value} = signinSchema.validate(req.body);

        if(error){
            return res.status(400).json({success: false, message: error.details[0].message});
        }

        const existingUser = await User.findOne({email}).select('+password');

        if(!existingUser){
            return res.status(404).json({success: false, message: 'User does not exist'});
        }

        //when the user exist
        const compared_password = await comparingPassword(password, existingUser.password);
        // compared_password will have a value of true if the password exists

        if(!compared_password){
            return res.status(401).json({success: false, message: 'Password is incorrect'});
        }

        const payload = {
            userId: existingUser._id,
            email: existingUser.email,
            verified: existingUser.verified,
        }

        const token = jwt.sign(payload , process.env.TOKEN_SECRET, {expiresIn: '8h'});
        
        const expiresAfterEightHrs = new Date(Date.now() + 8 * 3600000); // eight hours in milliseconds

        return res.status(200)
                .cookie('Authorization', 'Bearer ' + token, 
                    {expires: expiresAfterEightHrs,
                        httpOnly: process.env.NODE_ENV === 'production',
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'Strict',
                        path: '/'
                    })
                .json({success: true, token, message: 'logged in successfully'});
        
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
}


exports.logout = async (req, res) => {
    try {
        res.clearCookie('Authorization', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            path: '/'
        });

        //sending response 
        res.status(200).json({success: true, message: 'Logged out successfully'})

    } catch (error) {
        console.log(error)
        res.status(500).json({success: false, message: 'An error occurred during logging out'} )
    }
}

exports.sendVerificationCode = async (req, res) => {
    const {email} = req.body
    try {
        const existingUser = await User.findOne({email});
        if (!existingUser){
            return res.status(404).json({success: false, message: 'User does not exist'})
        }

        if (existingUser.verified){
            return res.status(400).json({success: false, message: 'User is already verified'})
        }

        const generatedVerificationCode = generateVerificationCode(6)

        let info = await transport.sendMail({
            from: process.env.EMAIL_USER,
            to: existingUser.email,
            subject: 'Verification code',
            html: `<h1>${generatedVerificationCode}</h1>`
        })

        if (info.response && info.response.includes('OK')){
            const hashedCodedValue = hmacProcess(generatedVerificationCode, process.env.HMAC_VERIFICATION_SECRET_CODE);
            existingUser.verificationCode = hashedCodedValue;
            existingUser.verificationCodeExpires = Date.now() + 3600000;
            await existingUser.save();

            return res.status(200).json({success: true, message: 'Verification code sent'})
        }

        res.status(400).json({success: false, message: 'Verification code not sent'})
       

    } catch (error) {
        res.status(500).json({success: false, message: 'Error sending verification code: ' + error.message})
    }

}
