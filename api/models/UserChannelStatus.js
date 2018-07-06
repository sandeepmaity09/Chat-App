const Sequlize = require('sequelize');
const sequlize = require('../../config/database');

const tableName = 'chat_user_channel_status';

const UserChannelStatus = sequlize.define('UserChannelStatus', {
    userchannelstatus_id: {
        type: Sequlize.INTEGER,
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
    socket_id: {
        type: Sequlize.STRING
    },
    user_channel_status: {
        type: Sequlize.INTEGER(2)
    },
    userchannel_status: {
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

module.exports = UserChannelStatus;