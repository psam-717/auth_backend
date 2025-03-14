require('dotenv').config();
const jwt = require('jsonwebtoken');
const { signupSchema, signinSchema, verifyCodeSchema, changePasswordSchema, verifyForgotPasswordCodeSchema } = require("../middlewares/validator.js");
const User = require("../models/users.models.js");
const { comparingPassword } = require("../utils/compare.password.js");
const { hashPassword } = require("../utils/hashing.js");
const transport = require('../middlewares/sendMail.js');
const generateVerificationCode = require('../utils/verification.code.js');
const { hmacProcess } = require('../utils/hmac.js');
const generateNumericVerificationCode = require('../utils/numeric.verification.code.js');

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
        console.log('Token generated at: ', new Date(), 'with verified status ', existingUser.verified, 'userId', existingUser._id, 'email', existingUser.email)

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
    const {email} = req.body;
    try {
        const existingUser = await User.findOne({email});
        if (!existingUser){
            return res.status(404).json({success: false, message: 'User does not exist'})
        };

        if (existingUser.verified){
            return res.status(400).json({success: false, message: 'User is already verified'});
        }

        const generatedVerificationCode = generateVerificationCode(6);

        let info = await transport.sendMail({
            from: process.env.EMAIL_USER,
            to: existingUser.email,
            subject: 'Verification code',
            html: `<h1>${generatedVerificationCode}</h1>`
        })

        if (info.response && info.response.includes('OK')){
            const hashedProvidedCode = hmacProcess(generatedVerificationCode, process.env.HMAC_VERIFICATION_SECRET_CODE);
            existingUser.verificationCode = hashedProvidedCode;
            const ONE_HR_IN_MS = 60 * 60 * 1000;
            existingUser.verificationCodeValidation = Date.now() + ONE_HR_IN_MS;
            await existingUser.save();

            return res.status(200).json({success: true, message: 'Verification code sent'});
        }

        return res.status(400).json({success: false, message: 'Verification code not sent'});
       

    } catch (error) {
        res.status(500).json({success: false, message: 'Error sending verification code: ' + error.message});
    }

}



exports.verifyVerificationCode = async (req, res) => {
    try {
        const {email, providedCode} = req.body;
        const {error, value} = verifyCodeSchema.validate(req.body);

        if (error){
            return res.status(401).json({success: false, message: 'Wrong email or verification code'});
        }

        //const codeValue = providedCode;
        // the contents of the select method below are components of the document for the user model
        // the prefix + is used to override the select: false property is the user model
        const existingUser = await User.findOne({email}).select('+verificationCode +verificationCodeValidation');

        if(!existingUser){
            return res.status(401).json({success: false, message: 'User is not found'});
        }

        if(existingUser.verified){
            return res.status(401).json({success: false, message: 'Email is already verified'});
        }


        if(!existingUser.verificationCode || !existingUser.verificationCodeValidation){
            return res.status(401).json({success: false, message: 'Verification code is not right'});
        }

        const ONE_HR_IN_MS = 60 * 60 * 1000;
        if(Date.now() > existingUser.verificationCodeValidation){
            return res.status(401).json({success: false, message: 'Verification code has expired'});
        }
        
        const hashedProvidedCode = hmacProcess(providedCode, process.env.HMAC_VERIFICATION_SECRET_CODE);
       
        if(hashedProvidedCode === existingUser.verificationCode){
            // set the verified field of the user document to true when the verification code is right
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            await existingUser.save();


            const userId = existingUser._id;
            const verified = existingUser.verified;
            const token = jwt.sign({userId, email ,verified}, process.env.TOKEN_SECRET, {expiresIn: '8h'});
            console.log('Token generated at ', new Date(), 'with payload ', {userId, email ,verified});

            const expirationAfterEightHrs = new Date(Date.now() + 8 * 3600000)
            return res.status(200).cookie('Authorization', 'Bearer '+ token, {
                    expires: expirationAfterEightHrs,
                    httpOnly: process.env.NODE_ENV === 'production',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'Strict',
                    path: '/'
            }).json({success: true, message: 'Code is valid and your account has been verified',token: token})
        }

        return res.status(400).json({success: false, message: 'Unexpected occurred, your code may not be right'})
        
    } catch (error) {
        res.status(500).json({success: false, message: 'Error verifying code: '+ error.message});
    }

}

exports.home = async (req, res) => {
    const {email} = req.body;
    const exitingUser = await User.findOne({email});

    console.log('verified Status: ', exitingUser.verified);
    res.status(200).json({message: `Welcome ${exitingUser.email}`});
}

exports.changePassword = async (req,res) =>{
    const {userId, verified} = req.user;
    const {oldPassword, newPassword} = req.body;

    try {
        const {error, value} = changePasswordSchema.validate(req.body);

        if(error){
            return res.status(401).json({success: false, message: error.details[0].message});
        }
        if(!verified){
            return res.status(401).json({success: false, message: 'You are not verified'});
        }

        const existingUser = await User.findOne({_id:userId}).select('+password');

        if (!existingUser){
            return res.status(401).json({success: false, message: 'User does not exist'});
        }

        const result = await comparingPassword(oldPassword, existingUser.password);
      
        if(!result){
            return res.status(401).json({success: false, message: 'Invalid credentials. Old password is not right'});
        }

        const hashedPassword = await hashPassword(newPassword);
        existingUser.password = hashedPassword;
        await existingUser.save()
        return res.status(200).json({success: true, message: 'Password updated'});

    } catch (error) {
        return res.status(500).json({success: false, message: 'Error encountered during password change'})
    }
}


exports.sendForgotPasswordCode = async (req, res) => {
    const {email} = req.body;
    try {
        const existingUser = await User.findOne({email});
        if (!existingUser){
            res.status(401).json({success: false, message: 'User does not exist'})
        };

        const generatedNumericCode = generateNumericVerificationCode();
        let info = await transport.sendMail({
            from: process.env.EMAIL_USER,
            to: existingUser.email,
            subject: 'Forgot Password Code',
            html: `<h1>${generatedNumericCode}</h1>`
        })

        if(info.response && info.response.includes('OK')){
            const hashedProvidedCode = hmacProcess(generatedNumericCode, process.env.HMAC_VERIFICATION_SECRET_CODE);
            existingUser.forgotPasswordCode = hashedProvidedCode;
            const ONE_HR_IN_MS = 3600000;
            existingUser.forgotPasswordCodeValidation = Date.now() + ONE_HR_IN_MS;
            await existingUser.save();

            return res.status(200).json({success: true, message: 'Forgot password code sent'});
        }
        return res.status(401).json({success: false, message: 'Forgot password code not sent' });

    } catch (error) {
        console.log(error)
        res.status(500).json({success: false, message: 'Error sending forgot password code: ' + error.message});
    }
}

exports.verifyForgotPasswordCode = async (req, res) => {
    try {
        const {email, forgotPasswordCode, newPassword} = req.body;
        const {error, value} = verifyForgotPasswordCodeSchema.validate(req.body);

        if (error){
            return res.status(401).json({success: false, message: 'Wrong email, forgot password code'});
        }

        const existingUser = await User.findOne({email}).select('+forgotPasswordCode +forgotPasswordCodeValidation');

        if(!existingUser){
            return res.status(401).json({success: false, message: 'User is not found'});
        }

        if(!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation){
            return res.status(401).json({success: false, message: 'Forgot password code is not right'});
        }

        if(Date.now() > existingUser.forgotPasswordCodeValidation){
            return res.status(401).json({success: false, message: 'Forgot password code has expired'});
        }

        const hashedForgotPasswordCode = hmacProcess(forgotPasswordCode, process.env.HMAC_VERIFICATION_SECRET_CODE);

        if (hashedForgotPasswordCode === existingUser.forgotPasswordCode){
            existingUser.forgotPasswordCode = undefined;
            existingUser.forgotPasswordCodeValidation = undefined;


            //hashing the new password
            const hashed_Password = await hashPassword(newPassword);

            existingUser.password = hashed_Password;

            await existingUser.save();

            return res.status(200).json({success: true, message: 'Your code is valid and your password has been updated'})
        }


    } catch (error) {
        console.log(error)
    }
}