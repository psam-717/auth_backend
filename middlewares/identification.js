const jwt = require('jsonwebtoken');


exports.authenticateToken = (req, res, next) => {
    let token;
    let userToken;

    // verifying the TOKEN_SECRET
    if(!process.env.TOKEN_SECRET){
        return res.status(401).json({success: false, message: 'TOKEN_SECRET is unavailable'});
    }

    if(req.headers.authorization){
        token = req.headers.authorization;

        if(!token || !token.toLowerCase().startsWith('bearer')){
            return res.status(401).json({success: false, message: 'Unauthorized. Invalid or missing authorization header'});
        }
        // when user token exists...
        userToken = token.split(" ")[1]?.trim();
        if(!userToken){
            return res.status(401).json({success: false, message: 'Unauthorized. Invalid or missing token'});
        }

    } else if(req.cookies && req.cookies['Authorization']){
        token = req.cookies['Authorization'];
        userToken = token.toLowerCase().startsWith('bearer') ? token.split(" ")[1].trim() : token;

    }else {
        return res.status(401).json({success: false, message: 'Missing token in header or in cookie'});
    }        
        

    try {
        const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET);
        req.user = jwtVerified;
        next();

        console.log(req.user)

    } catch (error) {
        if(error.name === 'TokenExpiredError'){
            return res.status(401).json({success: false, message: 'Token is expired'});
        }else if (error.name === 'JsonWebTokenError'){
            return res.status(401).json({success: false, message: 'Error in json web token'});
        }

        return res.status(500).json({success: false, message: 'Error generating token'});

    }
}

