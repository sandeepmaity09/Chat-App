const Sequlize = require('sequelize');
const sequlize = require('../../config/database');

const tableName = 'chat_groups';

const Group = sequlize.define('Group', {
    id: {
        type: Sequlize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },
    place_id: {
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

module.exports = Group;