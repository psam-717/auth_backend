const jwt = require('jsonwebtoken');


exports.authenticateToken = (req, res, next) => {
    // verifying the TOKEN_SECRET
    if(!process.env.TOKEN_SECRET){
        return res.status(401).json({success: false, message: 'TOKEN_SECRET is unavailable'});
    }

    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.['Authorization'];
    let userToken;

    if(authHeader){
        if(!authHeader.toLowerCase().startsWith('bearer')){
            return res.status(401).json({success: false, message: 'Invalid token format'});
        }
        userToken = authHeader.split(" ")[1]?.trim();
        
    } else if(cookieToken){
        userToken = cookieToken.toLowerCase().startsWith('bearer') ? cookieToken.split(" ")[1].trim() : cookieToken;
    }
    
    if(!userToken){
        return res.status(401).json({success: false, message: 'No token provided'});
    }


    try {
        const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET);
        req.user = jwtVerified;
        next();

    } catch (error) {
        if(error.name === 'TokenExpiredError'){
            return res.status(401).json({success: false, message: 'Token is expired'});
        }else if (error.name === 'JsonWebTokenError'){
            return res.status(401).json({success: false, message: 'Error in json web token'});
        }
        return res.status(401).json({success: false, message: 'Authentication failed'});
    }
}

