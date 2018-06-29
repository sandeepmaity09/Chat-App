const UserChannelStatus = require('../../models/UserChannelStatus');
const sequlize = require('../../../config/database');
const getUTCDate = require('../../helpers/dateHelpers');

const UserChannelStatusService = () => {

    const createUserChannelStatus = (userchannelstatusobj) => {
        return UserChannelStatus.create(userchannelstatusobj);
    }

    const findUserChannelStatusByUserIdChannelId = (userId, channelId) => {
        return UserChannelStatus.find({ where: { user_id: userId, channel_id: channelId }, raw: true })
    }

    const updateUserChannelStatus = (userId, channelId, userChannelStatus) => {
        return sequlize.query(`UPDATE chat_user_channel_status SET user_channel_status = ${userChannelStatus}, updated_at = "${getUTCDate()}" WHERE user_id = ${userId} AND channel_id = ${channelId}`, { type: sequlize.QueryTypes.UPDATE });
    }

    const findUsersStatusByChannelIdAndList = (channelId, usersList) => {
        return UserChannelStatus.findAll({ attributes: ['user_id', 'user_channel_status'], where: { channel_id: channelId, user_id: usersList }, raw: true })
    }

    const findUsersStatusByChannelIdAndListWithDevice = (channelId, usersList) => {
        return UserChannelStatus.findAll({ attributes: ['user_id', 'user_channel_status'], where: { channel_id: channelId, user_id: usersList }, raw: true })
    }

    return {
        createUserChannelStatus,
        findUserChannelStatusByUserIdChannelId,
        updateUserChannelStatus,
        findUsersStatusByChannelIdAndList,
        findUsersStatusByChannelIdAndListWithDevice
    }
}

module.exports = UserChannelStatusService;