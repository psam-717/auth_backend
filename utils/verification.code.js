const crypto = require('crypto');

function generateVerificationCode(length = 6){
    try {
        const byteLength = Math.ceil(length/2);
        const bytes = crypto.randomBytes(byteLength);
        return bytes.toString('hex').slice(0, length);
    } catch (error) {
        throw new Error('Failed to generate the verification code')
    }
}

module.exports = generateVerificationCode;