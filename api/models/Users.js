const Sequlize = require('sequelize');
const sequlize = require('../../config/database');

const tableName = 'users';


const Users = sequlize.define('Users', {
    user_id: {
        type: Sequlize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },
    account_type: {
        type: Sequlize.INTEGER,
    },
    company_id: {
        type: Sequlize.INTEGER
    },
    user_name: {
        type: Sequlize.STRING(100)
    },
    email: {
        type: Sequlize.STRING(100)
    },
    designation: {
        type: Sequlize.INTEGER
    },
    password: {
        type: Sequlize.STRING
    },
    udid: {
        type: Sequlize.STRING
    },
    touch_login: {
        type: Sequlize.INTEGER(4)
    },
    country_code: {
        type: Sequlize.STRING(100)
    },
    mobile_number: {
        type: Sequlize.STRING(30)
    },
    profile_picture: {
        type: Sequlize.STRING
    },
    datetime: {
        type: Sequlize.STRING(30)
    },
    timezone: {
        type: Sequlize.STRING(100)
    },
    rolodex_collectinginfo: {
        type: Sequlize.INTEGER
    },
    new_email_to_change: {
        type: Sequlize.STRING
    },
    device_change_verify_code: {
        type: Sequlize.STRING(10)
    },
    email_change_verify_code: {
        type: Sequlize.STRING(10)
    },
    email_varification: {
        type: Sequlize.STRING(20)
    },
    last_email: {
        type: Sequlize.STRING
    },
    registered_at: {
        type: Sequlize.DATE,
        defaultValue: Sequlize.NOW
    },
    last_login: {
        type: Sequlize.DATE,
        defaultValue: Sequlize.NOW
    },
    updated_at: {
        type: Sequlize.DATE,
        defaultValue: Sequlize.NOW
    },
    is_active: {
        type: Sequlize.INTEGER
    }
},
    {
        timestamps: false,
        tableName: tableName
    }
)

module.exports = Users;