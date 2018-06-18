const Sequlize = require('sequelize');
const sequlize = require('../../config/database');

const tableName = 'chat_channel_users';

const ChannelUsers = sequlize.define('ChannelUsers', {
    id: {
        type: Sequlize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },
    channel_id: {
        type: Sequlize.INTEGER,
    },
    user_id: {
        type: Sequlize.INTEGER,
    },
    created_at: {
        type: Sequlize.DATE,
        defaultValue: Sequlize.NOW
    }
},
    {
        timestamps: false,
        tableName: tableName
    }
)

module.exports = ChannelUsers;