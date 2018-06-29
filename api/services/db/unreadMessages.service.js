const UnreadMessage = require('../../models/UnreadMessages');
const sequlize = require('../../../config/database');
const getUTCDate = require('../../helpers/dateHelpers');


const UnreadMessagesService = () => {

    const findUnreadMessageByUserIdChannelId = (userId, channelId) => {
        return UnreadMessage.find({ where: { user_id: userId, channel_id: channelId }, raw: true })
    }

    const updateUnreadMessage = (unreadId, messageId) => {
        return sequlize.query(`UPDATE chat_unread_messages SET message_id = ${parseInt(messageId)}, updated_at = "${getUTCDate()}" WHERE unread_id = ${parseInt(unreadId)}`, { type: sequlize.QueryTypes.UPDATE });
    }

    const insertUnreadMessage = (userId, channelId, messageId) => {
        return sequlize.query(`INSERT INTO chat_unread_messages(message_id,user_id,channel_id,unread_status,created_at,updated_at) VALUES(${parseInt(messageId)},${parseInt(userId)},${parseInt(channelId)},${parseInt('1')},"${getUTCDate()}","${getUTCDate()}"`)
    }
    return {
        findUnreadMessageByUserIdChannelId,
        updateUnreadMessage,
        insertUnreadMessage
    }
}

module.exports = UnreadMessagesService;