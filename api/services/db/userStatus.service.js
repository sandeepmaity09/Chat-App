const UserStatus = require('../../models/UserStatus');
const sequlize = require('../../../config/database');
const getUTCDate = require('../../helpers/dateHelpers');

const UserStatusService = () => {

    const findUserStatusByUserId = (userId) => {
        return UserStatus.findAll({ where: { user_id: userId }, raw: true });
    }

    const findAndUpdateUserStatus = (userstatusobj) => {

    }

    const createUserStatus = (userstatusobj) => {
        return UserStatus.create(userstatusobj)
    }

    const updateUserStatus = (userId, userStatus) => {
        return sequlize.query(`UPDATE chat_user_status SET user_status = ${parseInt(userStatus)}, updated_at = "${getUTCDate()}" WHERE user_id = ${parseInt(userId)}`, { type: sequlize.QueryTypes.UPDATE })
    }


    return {
        findUserStatusByUserId,
        createUserStatus,
        updateUserStatus
    }
}

module.exports = UserStatusService;