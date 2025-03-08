const bcrypt = require('bcryptjs')


exports.hashPassword = async (password, saltRound = 10) => {
    try {
        // generate salt 
        const salt = await bcrypt.genSalt(saltRound);

        //hash password with generated salt
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error hashing password ', error);
    }

}