const Sequlize = require('sequelize');
const sequlize = require('../../config/database');

const tableName = 'chat_channels';

const Channel = sequlize.define('Channel', {
    channel_id: {
        type: Sequlize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },
    channel_name: {
        type: Sequlize.STRING,
        unique: true,
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

module.exports = Channel;