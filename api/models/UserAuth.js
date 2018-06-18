const Sequlize = require('sequelize');
const sequlize = require('../../config/database');

const tableName = 'users_authentication';

const UserAuth = sequlize.define('UserAuth', {
    id: {
        type: Sequlize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },
    user_id: {
        type: Sequlize.INTEGER,
        unique: true,
    },
    token: {
        type: Sequlize.STRING,
    },
    device_type: {
        type: Sequlize.INTEGER
    },
    device_token: {
        type: Sequlize.STRING
    },
    login_at: {
        type: Sequlize.DATE,
        defaultValue: Sequlize.NOW
    }
},
    {
        timestamps: false,
        tableName: tableName
    }
)

module.exports = UserAuth;