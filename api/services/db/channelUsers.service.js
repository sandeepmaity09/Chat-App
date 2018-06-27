const ChannelUsers = require('../../models/ChannelUsers');

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

    return {
        createChannelUser,
        findOrCreateChannelUser,
        removeChannelUser,
        findChannelUsers
    }
}

module.exports = ChannelUsersService;