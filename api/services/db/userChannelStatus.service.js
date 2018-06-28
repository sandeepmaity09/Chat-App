const UserChannelStatus = require('../../models/UserChannelStatus');
const sequlize = require('../../../config/database');
const getUTCDate = require('../../helpers/dateHelpers');

const UserChannelStatusService = () => {

    // const findUserStatusByUserId = (userId) => {
    //     return UserStatus.findAll({ where: { user_id: userId }, raw: true });
    // }

    // const findAndUpdateUserStatus = (userstatusobj) => {

    // }

    // const createUserStatus = (userstatusobj) => {
    //     return UserStatus.create(userstatusobj)
    // }

    // const updateUserStatus = (userId, userStatus) => {
    //     return sequlize.query(`UPDATE chat_user_status SET user_status = ${parseInt(userStatus)}, updated_at = "${getUTCDate()}" WHERE user_id = ${parseInt(userId)}`, { type: sequlize.QueryTypes.UPDATE })
    // }

    const createUserChannelStatus = (userchannelstatusobj) => {
        return UserChannelStatus.create(userchannelstatusobj);
    }

    const findUserChannelStatusByUserIdChannelId = (userId, channelId) => {
        return UserChannelStatus.find({ where: { user_id: userId, channel_id: channelId }, raw: true })
    }

    const updateUserChannelStatus = (userId, channelId, userChannelStatus) => {
        return sequlize.query(`UPDATE chat_user_channel_status SET user_channel_status = ${userChannelStatus}, updated_at = "${getUTCDate()}" WHERE user_id = ${userId} AND channel_id = ${channelId}`, { type: sequlize.QueryTypes.UPDATE });
    }

    return {
        createUserChannelStatus,
        findUserChannelStatusByUserIdChannelId,
        updateUserChannelStatus
    }
}

module.exports = UserChannelStatusService;