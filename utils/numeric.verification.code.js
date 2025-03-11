function generateNumericVerificationCode() {
    
    const numericVerificationCode = Math.floor(100000 + Math.random() * 900000).toString().padStart(6,'0');
    return numericVerificationCode;
}

module.exports = generateNumericVerificationCode;