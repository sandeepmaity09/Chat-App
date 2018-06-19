const Message = require('../../models/Messages');

const MessageService = () => {

    const getMessageById = (id) => {
        return Message.find({ where: { message_id: id }, raw: true })
    }
    return {
        getMessageById
    }
}

module.exports = MessageService;