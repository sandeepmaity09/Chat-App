const Sequlize = require('sequelize');
const sequlize = require('../../config/database');

const tableName = 'chat_flagged_messages';

const FlaggedMessages = sequlize.define('FlaggedMessages', {
    flaggedmessage_id: {
        type: Sequlize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },
    message_id: {
        type: Sequlize.BIGINT(11)
    },
    reported_id: {
        type: Sequlize.INTEGER(11),
    },
    reportee_id: {
        type: Sequlize.INTEGER(11),
    },
    msg_options: {
        type: Sequlize.INTEGER(4)
    },
    rpt_message: {
        type: Sequlize.STRING(500)
    },
    flaggedmessage_status: {
        type: Sequlize.TINYINT(2)
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

module.exports = FlaggedMessages;