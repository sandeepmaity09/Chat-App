const Sequlize = require('sequelize');
const sequlize = require('../../config/database');

const tableName = 'chat_user_socket';

const UserSocket = sequlize.define('UserSocket', {
    user_id: {
        type: Sequlize.INTEGER,
        unique: true
    },
    socket_id: {
        type: Sequlize.STRING,
        unique: true,
    },
    created_at: {
        type: Sequlize.DATE,
    },
    updated_at: {
        type: Sequlize.DATE,
    }
},
    {
        timestamps: false,
        tableName: tableName
    }
)

module.exports = UserSocket;