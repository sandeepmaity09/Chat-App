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


    return {
        createChannelUser,
        findOrCreateChannelUser,
        removeChannelUser
    }
}

module.exports = ChannelUsersService;