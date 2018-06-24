const Sequlize = require('sequelize');
const sequlize = require('../../config/database');

const tableName = 'chat_deleted_messages';

const DeletedMessages = sequlize.define('DeletedMessages', {
    deletedmessage_id: {
        type: Sequlize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },
    message_id: {
        type: Sequlize.BIGINT(11)
    },
    user_id: {
        type: Sequlize.INTEGER(11),
    },
    deletedmessage_status: {
        type: Sequlize.INTEGER(2)
    },
    created_at: {
        type: Sequlize.DATE,
        defaultValue: Sequlize.NOW
    },
    updated_at: {
        type: Sequlize.DATE,
        defaultValue: Sequlize.NOW
    }
},
    {
        timestamps: false,
        tableName: tableName
    }
)

module.exports = DeletedMessages;