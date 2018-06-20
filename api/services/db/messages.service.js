const Message = require('../../models/Messages');

const MessageService = () => {

    const getMessageById = (id) => {
        return Message.find({ where: { message_id: id }, raw: true })
    }

    const saveMessage = (message) => {
        return Message.create(message, { raw: true });
    }
    return {
        getMessageById,
        saveMessage
    }
}

module.exports = MessageService;