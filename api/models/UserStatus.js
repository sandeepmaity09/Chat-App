const Sequlize = require('sequelize');
const sequlize = require('../../config/database');

const tableName = 'chat_user_status';

const UserStatus = sequlize.define('UserStatus', {
    userstatus_id: {
        type: Sequlize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },
    user_id: {
        type: Sequlize.INTEGER(11)
    },
    user_status: {
        type: Sequlize.INTEGER(2)
    },
    userstatus_status: {
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

module.exports = UserStatus;