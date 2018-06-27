const Message = require('../../models/Messages');
const sequlize = require('../../../config/database');
const getUTCDate = require('../../helpers/dateHelpers');

const MessageService = () => {

    const getMessageById = (id) => {
        return Message.find({ where: { message_id: id }, raw: true })
    }

    const saveMessage = (message) => {
        return Message.create(message, { raw: true });
    }

    const getMessagesByChannelId = (channelId) => {
        return Message.findAll({ where: { channel_id: channelId }, raw: true })
    }

    const getPaginatedReadMessagesByChannelIdMessageId = (channelId, messageId) => {
        return sequlize.query(`SELECT * FROM chat_messages WHERE channel_id = ${parseInt(channelId)} AND message_id <= ${parseInt(messageId)} LIMIT 50`, { type: sequlize.QueryTypes.SELECT });
    }

    const getPaginatedUnreadMessagesByChannelIdMessageId = (channelId, messageId) => {
        return sequlize.query(`SELECT * FROM chat_messages WHERE channel_id = ${parseInt(channelId)} AND message_id > ${parseInt(messageId)}`, { type: sequlize.QueryTypes.SELECT });
    }

    const getPaginatedReadMessagesWithoutSameByChannelIdMessageId = (channelId, messageId) => {
        return sequlize.query(`SELECT * FROM chat_messages WHERE channel_id = ${parseInt(channelId)} AND message_id < ${parseInt(messageId)} LIMIT 50`, { type: sequlize.QueryTypes.SELECT })
    }
    return {
        getMessageById,
        saveMessage,
        getMessagesByChannelId,
        getPaginatedReadMessagesByChannelIdMessageId,
        getPaginatedUnreadMessagesByChannelIdMessageId,
        getPaginatedReadMessagesWithoutSameByChannelIdMessageId
    }
}

module.exports = MessageService;