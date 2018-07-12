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

    const getMessageByIdJoinWithUsername = (channelId) => {
        return sequlize.query(`SELECT message_id,chat_messages.user_id,user_name,message_type,message,filelink,chat_messages.created_at,chat_messages.updated_at FROM chat_messages LEFT JOIN users ON chat_messages.user_id = users.user_id WHERE channel_id = ${channelId} AND message_status = 1 ORDER BY 'message_id'  DESC`, { type: sequlize.QueryTypes.SELECT });
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

    const createMultimediaMessage = (message) => {
        return sequlize.query(`INSERT INTO chat_messages(user_id,channel_id,chat_type,message_type,message,parent_id,filelink,thumbnail,is_flagged,message_status,created_at,updated_at) VALUES(${parseInt(message.user_id)},${parseInt(message.channel_id)},${parseInt(message.chat_type)},${parseInt(message.message_type)},"${message.message}",${parseInt(message.parent_id)},"${message.filelink}","${message.thumbnail}",${parseInt(message.is_flagged)},${parseInt(message.message_status)},"${message.created_at}","${message.updated_at}")`, { type: sequlize.QueryTypes.INSERT })
    }
    return {
        getMessageById,
        saveMessage,
        getMessagesByChannelId,
        getMessageByIdJoinWithUsername,
        createMultimediaMessage,
        getPaginatedReadMessagesByChannelIdMessageId,
        getPaginatedUnreadMessagesByChannelIdMessageId,
        getPaginatedReadMessagesWithoutSameByChannelIdMessageId
    }
}

module.exports = MessageService;