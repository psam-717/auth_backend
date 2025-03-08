const Joi = require('joi');

exports.signupSchema = Joi.object({
    email: Joi.string()
        .min(5)
        .required()
        .max(70)
        .email({
        tlds: {
            allow: ['com', 'net']
        }})
        .message('Please provide a valid email ending in .com or .net'),
    password: Joi.string()
        .required()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
        .message('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit')
})
exports.signinSchema = Joi.object({
    email: Joi.string()
        .min(5)
        .required()
        .max(70)
        .email()
        .message('Email is incorrect'),
    password: Joi.string()
        .required()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
        .message('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit')
})