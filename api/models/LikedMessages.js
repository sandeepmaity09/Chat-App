const Sequlize = require('sequelize');
const sequlize = require('../../config/database');

const tableName = 'chat_liked_messages';

const LikedMessages = sequlize.define('LikedMessages', {
    likedmessage_id: {
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
    likedmessage_status: {
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

module.exports = LikedMessages;