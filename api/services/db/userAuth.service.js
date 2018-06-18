const UserAuth = require('../../models/UserAuth');

const UserAuthService = () => {

    const getUserAuth = (userauth) => {
        return UserAuth.find({ where: { user_id: userauth.user_id }, raw: true })
    }


    return {
        getUserAuth
    }
}

module.exports = UserAuthService;