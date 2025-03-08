const mongoose = require('mongoose')
const validator = require('validator')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email must be unique'],
        trim: true,
        minlength: [5, 'Email length must be at least 5'],
        lowercase: true,
        validate: {
            validator : validator.isEmail,
            message: 'Please provide a valid email address'
        }
    },
    password: {
        type: String,
        required:[ true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false, // ensures that password is not included in the data that will be retrieved when queried
        trim: true,
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        select: false
    },
    verificationCodeValidation: {
        type: Number,
        select: false
    },
    forgotPasswordCode: {
        type: String,
        select: false,
    },
    forgotPasswordCodeValidation: {
        type: Number,
        select: false
    }
},{
    timestamps: true
})

const User = mongoose.model('User', userSchema);

module.exports = User;