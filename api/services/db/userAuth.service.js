const UserAuth = require('../../models/UserAuth');
const sequlize = require('../../../config/database');
const getUTCDate = require('../../helpers/dateHelpers');

const UserAuthService = () => {

    const getUserAuth = (userauth) => {
        return UserAuth.find({ where: { user_id: userauth.user_id }, raw: true })
    }

    const getUserAuthByUserList = (userList) => {
        return UserAuth.findAll({ attributes: ['user_id', 'device_type', 'device_token'], where: { user_id: userList }, raw: true })
    }


    return {
        getUserAuth,
        getUserAuthByUserList
    }
}

module.exports = UserAuthService;