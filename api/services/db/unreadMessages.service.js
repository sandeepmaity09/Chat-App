const UnreadMessage = require('../../models/UnreadMessages');
const sequlize = require('../../../config/database');
const getUTCDate = require('../../helpers/dateHelpers');


const UnreadMessagesService = () => {

    const findUnreadMessageByUserIdChannelId = (userId, channelId) => {
        return UnreadMessage.find({ where: { user_id: userId, channel_id: channelId }, raw: true })
    }

    return {
        findUnreadMessageByUserIdChannelId
    }
}

module.exports = UnreadMessagesService;