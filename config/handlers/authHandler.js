const responseObj = require('../../api/helpers/responseObj');

const userAuthService = require('../../api/services/db/userAuth.service')();
const Encrypter = require('../../api/helpers/aesHelpers');


const isRequestAuthenticated = function (authKey, userId, token) {

}

// async function authKeyChecker(authKey) {
//     if (authKey === process.env.AUTH_KEY) {
//         console.log("auth Key Matched Successfully");
//     }
// }

async function authKeyValidator(req, res, next) {
    let authKey = req.get('Auth-Key');
    if (authKey === process.env.AUTH_KEY) {
        console.log("auth key Matched Successfully");
        next();
    } else {
        return res.json(new responseObj("Unauthorized", 401, false));
    }
}



// async function tokenValidator(userid, token) {
//     console.log('this is userid and token', userid, token);
//     let userId;
//     try {
//         userId = parseInt(Encrypter.aesDecryption(process.env.ENCRYPT_KEY, userid));
//         console.log('this is userID', userId);
//     } catch (err) {
//         console.log('Encoding is not proper', err);
//     }
//     let authContent;
//     try {
//         console.log('this is userID', userId);
//         let userauth = {
//             user_id: userId
//         }
//         authContent = await userAuthService.getUserAuth(userauth);
//         console.log('this is authcontent', authContent);
//     } catch (err) {
//         console.log('this is error form authContent', err);
//     }

//     if (authContent) {
//         console.log('this is authToken', authContent.token.toString());
//         console.log('this is request token', token);
//         if (authContent.token === token) {
//             console.log("token matched");
//         }
//         else {
//             console.log('unauthorized, token mismatched');
//         }
//     } else {
//         console.log('no data found. user doesnot exist in users_authentication');
//     }
// }

async function tokenValidator(req, res, next) {
    let userid = req.get('userid');
    let token = req.get('token');

    let userId;
    try {
        userId = parseInt(Encrypter.aesDecryption(process.env.ENCRYPT_KEY, userid));
        // console.log('this is userID', userId);
    } catch (err) {
        console.log('Encoding is not proper', err);
    }
    let authContent;
    try {
        // console.log('this is userID', userId);
        let userauth = {
            user_id: userId
        }
        authContent = await userAuthService.getUserAuth(userauth);
        // console.log('this is authcontent', authContent);
    } catch (err) {
        console.log('this is error form authContent', err);
    }

    if (authContent) {
        // console.log('this is authToken', authContent.token.toString());
        // console.log('this is request token', token);
        if (authContent.token === token) {
            console.log("token matched");
            next();
        }
        else {
            console.log('unauthorized, token mismatched');
            return res.json(new responseObj('Unauthorized', 401, false));
        }
    } else {
        console.log('no data found. user doesnot exist in users_authentication');
        return res.json(new responseObj('Unauthorized', 401, false));
    }
}

module.exports = {
    authKeyValidator,
    tokenValidator
}