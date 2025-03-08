const bcrypt = require('bcryptjs')


exports.comparingPassword = async (plainPassword, hashedPassword) => {
    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    } catch (error) {
        throw new Error('Error comparing password', error.message);
    }
}