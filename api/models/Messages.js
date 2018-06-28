const Sequlize = require('sequelize');
const sequlize = require('../../config/database');

const tableName = 'chat_messages';

const Message = sequlize.define('Message', {
    message_id: {
        type: Sequlize.BIGINT(11),
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },
    user_id: {
        type: Sequlize.INTEGER(11)
    },
    channel_id: {
        type: Sequlize.INTEGER(11)
    },
    chat_type: {
        type: Sequlize.INTEGER(4)
    },
    message_type: {
        type: Sequlize.INTEGER(4)
    },
    message: {
        type: Sequlize.STRING(500)
    },
    parent_id: {
        type: Sequlize.BIGINT(11)
    },
    filelink: {
        type: Sequlize.STRING(255),
        allowNull: true
    },
    thumbnail: {
        type: Sequlize.STRING(255),
        allowNull: true
    },
    is_edited: {
        type: Sequlize.INTEGER(2)
    },
    is_flagged: {
        type: Sequlize.INTEGER(2)
    },
    message_status: {
        type: Sequlize.INTEGER(2)
    },
    created_at: {
        type: Sequlize.DATE
    },
    updated_at: {
        type: Sequlize.DATE
    }
},
    {
        timestamps: false,
        tableName: tableName
    }
)

module.exports = Message;