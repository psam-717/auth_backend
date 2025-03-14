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

exports.verifyCodeSchema = Joi.object({
    email: Joi.string()
        .min(5)
        .required()
        .max(70)
        .email(),
    providedCode: Joi.string()
                    .max(6)
                    .required()           
})  


exports.changePasswordSchema = Joi.object({
    oldPassword: Joi.string()
                    .required()
                    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
                    .message('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit'),
    newPassword: Joi.string()
    .required()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .message('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit'),

})

exports.verifyForgotPasswordCodeSchema = Joi.object({
    email: Joi.string()
                .min(5)
                .required()
                .max(70)
                .email(),
    forgotPasswordCode : Joi.string()
                            .max(6)
                            .required(),
    newPassword: Joi.string()
                    .required()
                    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
                    .message('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit')

})

exports.makePostsSchema = Joi.object({
    title: Joi.string().min(2).required().messages({
        'string.empty': 'Title is required',
        'string.min': 'Title is must be at least to characters long',
    }),
    category: Joi.string().min(2).required().messages({
        'string.empty':'Category is required',
        'string.min':'Category must be at least two characters long'
    }),
    description: Joi.string().min(2).required().messages({
        'string.empty': 'description is required',
        'string.min': 'description must be at least two characters long'
    })

})


exports.updatePostsSchema = Joi.object({
    title: Joi.string().min(2).messages({
        'string.empty': 'Title is required',
        'string.min': 'Title is must be at least to characters long',
    }),
    category: Joi.string().min(2).messages({
        'string.empty':'Category is required',
        'string.min':'Category must be at least two characters long'
    }),
    description: Joi.string().min(2).messages({
        'string.empty': 'description is required',
        'string.min': 'description must be at least two characters long'
    })
}).or('title', 'description', 'category')
