const ChannelUsers = require('../../models/ChannelUsers');
const sequlize = require('../../../config/database');
const getUTCDate = require('../../helpers/dateHelpers');

const ChannelUsersService = () => {

    const createChannelUser = (channeluser) => {
        return ChannelUsers.create(channeluser);
    }

    const findOrCreateChannelUser = (channeluser) => {
        return ChannelUsers.findCreateFind({ where: { channel_id: channeluser.channel_id, user_id: channeluser.user_id }, raw: true });
    }

    const removeChannelUser = (channeluser) => {
        return ChannelUsers.destroy({ where: { channel_id: channeluser.channel_id, user_id: channeluser.user_id } });
    }

    const findChannelUsers = (channelId) => {
        return ChannelUsers.findAll({ where: { channel_id: channelId }, raw: true });
    }

    const findChannelUsersOnly = (channelId) => {
        return sequlize.query(`SELECT user_id FROM chat_channel_users WHERE channel_id = ${parseInt(channelId)}`, { type: sequlize.QueryTypes.SELECT });
    }

    return {
        createChannelUser,
        findOrCreateChannelUser,
        removeChannelUser,
        findChannelUsers,
        findChannelUsersOnly
    }
}

module.exports = ChannelUsersService;