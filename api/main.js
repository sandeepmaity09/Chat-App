/**
 * Third - Party Libraries
 */
const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const http = require('http');
const mapRoutes = require('express-routes-mapper');
const cors = require('cors');

const path = require('path');
const morgan = require('morgan');
const crypto = require('crypto');
const multer = require('multer');
const _ = require('underscore');
const request = require('request');
const axios = require('axios');
const Promise = require('bluebird');

/**
 * Promise Configuration
 */
global.Promise = Promise;

/**
 * Server Configuration
 */
const config = require('../config');
const dbService = require('./services/db.service');


/**
 * Environment Configuration
 */
const environment = process.env.NODE_ENV;

/**
 * Express Application & Socket Setup
 */
const app = express();
const server = http.Server(app);
let io = require('socket.io')(server);

/**
 * Static Resource Sharing
 */
app.use('/static', express.static(path.join(__dirname + '../../uploads')));
console.log(path.join(__dirname + '../../uploads'));


/**
 * Routing Setup
 */
const routes = require('../config/routes/chatRoutes');
const DB = dbService(environment, config.migrate).start();

/**
 * Cross - Origin Resource Sharing
 */
app.use(cors());

/**
 * Express Application Security
 */
app.use(helmet({
    dnsPrefetchControl: false,
    frameguard: false,
    ieNoOpen: false
}));

/**
 * Parsing Request Bodies Middleware Configuration
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/**
 * Development Logger
 */
app.use(morgan('dev'));



/**
 * 
 * Express Routes Application
 */
app.use('/inrchat/chatservice', routes);


/**
 * Server listener
 */
server.listen(config.port, () => {
    if (environment !== 'production' &&
        environment !== 'development' &&
        environment !== 'testing'
    ) {
        console.log(`NODE_ENV is set to ${environment}, but only production and developoment are valid`);
        process.exit(1);
    }
    console.log('Server running at port', config.port);
    return DB;
})

/**
 * Database Related Configuration
 */

const con = require('../config/mysqldb');
const sequelize = require('../config/database');

/**
 * Encryption AES Feature
 */
const Encryptor = require('../api/helpers/aesHelpers');
let getUTCDate = require('../api/helpers/dateHelpers');

/**
 * Services 
 */
const channelsService = require('../api/services/db/channels.service')();
const userStatusService = require('../api/services/db/userStatus.service')();
const userChannelStatusService = require('../api/services/db/userChannelStatus.service')();
const channelUsersService = require('../api/services/db/channelUsers.service')();
const CONSTANTS = require('../api/helpers/chatConstants');



app.get('/', function (req, res) {
    // res.end("Socket Connected!");
    console.log('socket connected');
    res.sendfile('index.html', {
        root: __dirname
    });
});

io.on('connection', async function (socket) {
    console.log('A new user connected', socket.id);
    console.log(getUTCDate());
    socket.send(JSON.stringify({
        socketID: socket.id,
        channelID: io.sockets.adapter.sids[socket.id]
    }));
    //////////////////////////////////////////////////////////////
    // "join channel" :- when user join a channel for first time
    //////////////////////////////////////////////////////////////

    socket.on("join channel", async function (data) {
        console.log('join user called by the socket user', socket.id);
        console.log('this is data received at join channel', data);
        let payloadContent;
        try {
            payloadContent = JSON.parse(data);
        } catch (err) {
            console.log('data parsing error', err);
        }
        let channelName = payloadContent.channel_name;
        let userId = payloadContent.user_id;
        try {
            channelName = Encryptor.aesDecryption(process.env.ENCRYPT_KEY, channelName);
            userId = Encryptor.aesDecryption(process.env.ENCRYPT_KEY, userId);
            console.log('this is channel name and user id ', channelName, userId);
        } catch (err) {
            console.log('Decryption Error', err);
        }
        let channelContent;
        try {
            let channelContentList = await channelsService.findOrCreateChannel({ channel_name: channelName });
            console.log('this is channel content', channelContentList);
            channelContent = channelContentList[0];
            // channelContent = await channelsService.findChannel({ channel_name: messageInfo.channel_name })
        } catch (err) {
            console.log('this is error from channelContent', err);
        }
        _.forEach(io.sockets.adapter.sids[socket.id], (item, value) => {
            if (item == socket.id || item == channelContent.channel_id) {

            } else {
                socket.leave(value);
            }
        })
        socket.join(channelContent.channel_id);
        let channelUserPayload = {
            user_id: Encryptor.aesEncryption(process.env.ENCRYPT_KEY, userId),
            channel_name: Encryptor.aesEncryption(process.env.ENCRYPT_KEY, channelName)
        }
        console.log('this is channel payload', channelUserPayload);
        setTimeout(function () {
            io.in(channelContent.channel_id).emit('join', JSON.stringify({
                payload: channelUserPayload
            }))
        }, 100)
    })

    //////////////////////////////////////////////////////////
    // "switch channel" :- when user changes a channel
    //////////////////////////////////////////////////////////

    socket.on("switch channel", async function (channeldata) {
        console.log('switch channel called by socket user', socket.id);
        console.log('this is data received at switch channel', channeldata);
        let channelInfo;
        try {
            channelInfo = JSON.parse(channeldata);
        } catch (err) {
            console.log("Parsing Error", err);
        }
        let channelName = channelInfo.channel_name;
        let userId = channelInfo.user_id;
        try {
            channelName = Encryptor.aesDecryption(process.env.ENCRYPT_KEY, channelName);
            userId = Encryptor.aesDecryption(process.env.ENCRYPT_KEY, userId);
        } catch (err) {
            console.log("Decryption Error", err);
        }
        let channelContent;
        try {
            let channelContentList = await channelsService.findOrCreateChannel({ channel_name: channelName });
            console.log('this is channel content', channelContentList);
            channelContent = channelContentList[0];
            // channelContent = await channelsService.findChannel({ channel_name: messageInfo.channel_name })
        } catch (err) {
            console.log('this is error from channelContent', err);
        }


        let selectedUserChannelContent;
        try {
            selectedUserChannelContent = await userChannelStatusService.findUserChannelStatusByUserIdChannelId(parseInt(userId), parseInt(channelContent.channel_id));
            console.log("this is selectedUserChannelConetent", selectedUserChannelContent);
        } catch (err) {
            console.log("UserChannelStatus Fetching Error", err);
        }
        try {
            if (selectedUserChannelContent) {
                // exist
                try {
                    let updatedUserChannelStatusContent = await userChannelStatusService.updateUserChannelStatus(parseInt(userId), parseInt(channelContent.channel_id), parseInt('1'));
                } catch (err) {
                    console.log("UserChannelStatus Updation Error", err);
                }
            } else {
                // not exist
                try {
                    userchannelobj = {
                        user_id: parseInt(userId),
                        channel_id: parseInt(channelContent.channel_id),
                        user_channel_status: parseInt('1')
                    }
                    let insertedUserChannelContent = await userChannelStatusService.createUserChannelStatus(userchannelobj);
                    if (insertedUserChannelContent) {
                    }
                } catch (err) {
                    console.log("UserChannelStatus Insertation Error", err);
                }
            }
        } catch (err) {
            console.log("UserChannelUpdationError", err);
        }
        // console.log("bhut sara data", io.sockets.adapter.sids[socket.id]);
        _.forEach(io.sockets.adapter.sids[socket.id], (item, value) => {
            if (value == socket.id || value == channelContent.channel_id) {

            } else {
                console.log("I am called leaving", item, value);
                socket.leave(value);
            }
        })
        console.log('Joininng channel', channelContent.channel_id);
        socket.join(channelContent.channel_id);
        socket.send(JSON.stringify({
            socketID: socket.id,
            channelID: io.sockets.adapter.sids[socket.id]
        }));
    })


    /////////////////////////////////////////////////////////////
    // "leave channel" :- when user leaves a channel 
    /////////////////////////////////////////////////////////////

    socket.on("leave channel", async function (channeldata) {
        console.log('leave channel called by socket user', socket.id);
        console.log('this is data received at leave channel', channeldata);
        let channelInfo;
        try {
            channelInfo = JSON.parse(channeldata);
        } catch (err) {
            console.log("Parsing Error", err);
        }
        let channelName = channelInfo.channel_name;
        let userId = channelInfo.user_id;
        try {
            channelName = Encryptor.aesDecryption(process.env.ENCRYPT_KEY, channelName);
            userId = Encryptor.aesDecryption(process.env.ENCRYPT_KEY, userId);
        } catch (err) {
            console.log("Decryption Error", err);
        }

        let channelContent;
        try {
            let channelContentList = await channelsService.findOrCreateChannel({ channel_name: channelName });
            console.log('this is channel content', channelContentList);
            channelContent = channelContentList[0];
        } catch (err) {
            console.log('this is error from channelContent', err);
        }

        let selectedUserChannelContent;
        try {
            selectedUserChannelContent = await userChannelStatusService.findUserChannelStatusByUserIdChannelId(parseInt(userId), parseInt(channelContent.channel_id));
            console.log("this is selectedUserChannelConetent", selectedUserChannelContent);
        } catch (err) {
            console.log("UserChannelStatus Fetching Error", err);
        }
        try {
            if (selectedUserChannelContent) {
                // exist
                try {
                    let updatedUserChannelStatusContent = await userChannelStatusService.updateUserChannelStatus(parseInt(userId), parseInt(channelContent.channel_id), parseInt('0'));
                } catch (err) {
                    console.log("UserChannelStatus Updation Error", err);
                }
            } else {
                // not exist
                try {
                    userchannelobj = {
                        user_id: parseInt(userId),
                        channel_id: parseInt(channelContent.channel_id),
                        user_channel_status: parseInt('0')
                    }
                    let insertedUserChannelContent = await userChannelStatusService.createUserChannelStatus(userchannelobj);
                    if (insertedUserChannelContent) {
                    }
                } catch (err) {
                    console.log("UserChannelStatus Insertation Error", err);
                }
            }
        } catch (err) {
            console.log("UserChannelUpdationError", err);
        }

        socket.leave(channelContent.channel_id);
    })


    //////////////////////////////////////////////////////////////
    // "send message" :- when user send messages through sockets
    //////////////////////////////////////////////////////////////

    socket.on('send message', async function (data) {
        console.log("send message is called by socket id", socket.id);

        let messageInfo;
        try {
            messageInfo = JSON.parse(data);
        } catch (err) {
            console.log("Parsing Error", err);
        }

        try {
            _.forEach(messageInfo, (value, key) => {
                messageInfo[key] = Encryptor.aesDecryption(process.env.ENCRYPT_KEY, messageInfo[key]);
            })
        } catch (err) {
            console.log("Decryption Error", err);
        }

        console.log('this is messageInfo after parsing', messageInfo);

        let chatType = parseInt(messageInfo.chat_type);
        let messageType = parseInt(messageInfo.message_type);

        let channelInfo;
        if (messageInfo.channel_name) {
            try {
                channelInfo = await channelsService.findChannel({ channel_name: messageInfo.channel_name })
            } catch (err) {
                console.log("Channel Fetching Error", err);
            }
        } else {
            try {
                channelInfo = await channelsService.findChannelById(parseInt(messageInfo.channel_id));
            } catch (err) {
                console.log("Channel Fetching Error", err);
            }
        }

        if (chatType) {
            // ONE To ONE Chat
            console.log('ONE TO ONE CHAT');
        } else {
            // Group Chat
            console.log('GROUP CHAT');
            if (messageType === CONSTANTS.MSG_TYPE_TEXT) {
                console.log("TEXT MESSAGE");
                let isReply = parseInt(messageInfo.parent_id);
                if (isReply) {
                    // Reply Message
                    console.log("This is Reply");
                    if (parseInt(messageInfo.is_edited)) {
                        // Edited
                        let insertedMessageInfo;
                        let updatedMessageInfo;
                        let replyMessageInfo;
                        try {
                            let insertedMessageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.SELECT });
                            insertedMessageInfo = insertedMessageContent[0];
                        } catch (err) {
                            console.log("Insertation Error", err);
                        }

                        try {
                            let updatedMessageContent = await sequelize.query(`UPDATE chat_messages SET message="${messageInfo.message}",is_edited=${parseInt(messageInfo.is_edited)},updated_at="${getUTCDate()}" WHERE message_id=${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.UPDATE });
                        } catch (err) {
                            console.log("Updateion Error", err);
                        }

                        try {
                            let updatedMessageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.SELECT });
                            updatedMessageInfo = updatedMessageContent[0];
                        } catch (err) {
                            console.log("Insertation Error", err);
                        }
                        delete updatedMessageInfo.channel_id;
                        updatedMessageInfo.channel_name = channelInfo.channel_name;

                        try {
                            let replyMessageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.parent_id)}`, { type: sequelize.QueryTypes.SELECT });
                            replyMessageInfo = replyMessageContent[0];
                        } catch (err) {
                            console.log("Database Selection Error", err);
                        }

                        // Unread code Here

                        try {
                            let unreadMessageSelectionContent = await sequelize.query(`SELECT * FROM chat_unread_messages WHERE user_id = ${parseInt(messageInfo.user_id)} AND channel_id = ${parseInt(channelInfo.channel_id)}`, { type: sequelize.QueryTypes.SELECT });
                            // console.log("unreadMessageSelectionContent", unreadMessageSelectionContent)
                            if (unreadMessageSelectionContent.length) {
                                // unread exist
                                // update the unread 
                                try {
                                    let unreadMessageUpdationContent = await sequelize.query(`UPDATE chat_unread_messages SET message_id = ${parseInt(updatedMessageInfo.message_id)}, updated_at = "${getUTCDate()}" WHERE unread_id = ${parseInt(unreadMessageSelectionContent[0].unread_id)}`, { type: sequelize.QueryTypes.UPDATE });
                                } catch (err) {
                                    console.log("Updation Error", err);
                                }
                            } else {
                                // unread not exist
                                try {
                                    let unreadMessaageInsertedContent = await sequelize.query(`INSERT INTO chat_unread_messages(message_id,user_id,channel_id,unread_status,created_at,updated_at) VALUES(${parseInt(updatedMessageInfo.message_id)},${parseInt(messageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt('1')},"${getUTCDate()}","${getUTCDate()}")`, { type: sequelize.QueryTypes.INSERT })
                                } catch (err) {
                                    console.log("Insertation Error", err);
                                }
                            }
                        } catch (err) {
                            console.log("Unread Error", err);
                        }


                        updatedMessageInfo.replyList = replyMessageInfo;
                        try {
                            _.forEach(updatedMessageInfo, (item, key) => {
                                if (typeof updatedMessageInfo[key] === 'object') {
                                    updatedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(updatedMessageInfo[key]));
                                } else {
                                    updatedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, updatedMessageInfo[key].toString());
                                }
                            })
                            console.log("this is insertedMessageInfo", updatedMessageInfo);
                        } catch (err) {
                            console.log("Encryption Error", err);
                        }
                        setTimeout(function () {
                            io.in(channelInfo.channel_id).emit('send', JSON.stringify({
                                message: updatedMessageInfo
                            }))
                        })
                    } else {
                        let insertedMessageId;
                        let insertedMessageInfo;
                        let replyMessageInfo;
                        try {
                            messageInfo.is_flagged = 0;
                            messageInfo.message_status = 1;
                            let insertedMessageContent = await sequelize.query(`INSERT INTO chat_messages(user_id,channel_id,chat_type,message_type,message,parent_id,filelink,thumbnail,is_edited,is_flagged,message_status,created_at,updated_at) VALUES(${parseInt(messageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt(messageInfo.chat_type)},${parseInt(messageInfo.message_type)},"${messageInfo.message}",${parseInt(messageInfo.parent_id)},"","",${parseInt(messageInfo.is_edited)},${parseInt(messageInfo.is_flagged)},${parseInt(messageInfo.message_status)},"${getUTCDate()}","${getUTCDate()}")`, { type: sequelize.QueryTypes.INSERT })
                            insertedMessageId = insertedMessageContent;
                        } catch (err) {
                            console.log("Insertation Error", err);
                        }
                        try {
                            let insertedMessageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(insertedMessageId)}`, { type: sequelize.QueryTypes.SELECT });
                            if (insertedMessageContent.length) {
                                insertedMessageInfo = insertedMessageContent[0];
                            }
                        } catch (err) {
                            console.log("Selection Error", err);
                        }
                        delete insertedMessageInfo.channel_id;
                        insertedMessageInfo.channel_name = channelInfo.channel_name;
                        try {
                            let replyMessageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.parent_id)}`, { type: sequelize.QueryTypes.SELECT });
                            replyMessageInfo = replyMessageContent[0];
                        } catch (err) {
                            console.log("Database Selection Error", err);
                        }

                        // unread code here : original

                        try {
                            let unreadMessageSelectionContent = await sequelize.query(`SELECT * FROM chat_unread_messages WHERE user_id = ${parseInt(messageInfo.user_id)} AND channel_id = ${parseInt(channelInfo.channel_id)}`, { type: sequelize.QueryTypes.SELECT });
                            // console.log("unreadMessageSelectionContent", unreadMessageSelectionContent)
                            if (unreadMessageSelectionContent.length) {
                                // unread exist
                                // update the unread 
                                try {
                                    let unreadMessageUpdationContent = await sequelize.query(`UPDATE chat_unread_messages SET message_id = ${parseInt(insertedMessageInfo.message_id)}, updated_at = "${getUTCDate()}" WHERE unread_id = ${parseInt(unreadMessageSelectionContent[0].unread_id)}`, { type: sequelize.QueryTypes.UPDATE });
                                } catch (err) {
                                    console.log("Updation Error", err);
                                }
                            } else {
                                // unread not exist
                                try {
                                    let unreadMessaageInsertedContent = await sequelize.query(`INSERT INTO chat_unread_messages(message_id,user_id,channel_id,unread_status,created_at,updated_at) VALUES(${parseInt(insertedMessageInfo.message_id)},${parseInt(messageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt('1')},"${getUTCDate()}","${getUTCDate()}")`, { type: sequelize.QueryTypes.INSERT })
                                } catch (err) {
                                    console.log("Insertation Error", err);
                                }
                            }
                        } catch (err) {
                            console.log("Unread Error", err);
                        }

                        insertedMessageInfo.replyList = replyMessageInfo;
                        try {
                            _.forEach(insertedMessageInfo, (item, key) => {
                                if (typeof insertedMessageInfo[key] === 'object') {
                                    insertedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(insertedMessageInfo[key]));
                                } else {
                                    insertedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, insertedMessageInfo[key].toString());
                                }
                            })
                            console.log("this is insertedMessageInfo", insertedMessageInfo);
                        } catch (err) {
                            console.log("Encryption Error", err);
                        }
                        setTimeout(function () {
                            io.in(channelInfo.channel_id).emit('send', JSON.stringify({
                                message: insertedMessageInfo
                            }))
                        })
                    }
                } else {
                    // Original Text Message
                    console.log("This is Just Text Message");
                    if (parseInt(messageInfo.is_edited)) {
                        // Edited
                        let insertedMessageInfo;
                        let updatedMessageInfo;
                        try {
                            let insertedMessageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.SELECT });
                            insertedMessageInfo = insertedMessageContent[0];
                        } catch (err) {
                            console.log("Insertation Error", err);
                        }

                        try {
                            let updatedMessageContent = await sequelize.query(`UPDATE chat_messages SET message="${messageInfo.message}",is_edited=${parseInt(messageInfo.is_edited)},updated_at="${getUTCDate()}" WHERE message_id=${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.UPDATE });
                        } catch (err) {
                            console.log("Updateion Error", err);
                        }

                        try {
                            let updatedMessageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.SELECT });
                            updatedMessageInfo = updatedMessageContent[0];
                        } catch (err) {
                            console.log("Insertation Error", err);
                        }

                        // Unread Code here

                        try {
                            let unreadMessageSelectionContent = await sequelize.query(`SELECT * FROM chat_unread_messages WHERE user_id = ${parseInt(messageInfo.user_id)} AND channel_id = ${parseInt(channelInfo.channel_id)}`, { type: sequelize.QueryTypes.SELECT });
                            // console.log("unreadMessageSelectionContent", unreadMessageSelectionContent)
                            if (unreadMessageSelectionContent.length) {
                                // unread exist
                                // update the unread 
                                try {
                                    let unreadMessageUpdationContent = await sequelize.query(`UPDATE chat_unread_messages SET message_id = ${parseInt(updatedMessageInfo.message_id)}, updated_at = "${getUTCDate()}" WHERE unread_id = ${parseInt(unreadMessageSelectionContent[0].unread_id)}`, { type: sequelize.QueryTypes.UPDATE });
                                } catch (err) {
                                    console.log("Updation Error", err);
                                }
                            } else {
                                // unread not exist
                                try {
                                    let unreadMessaageInsertedContent = await sequelize.query(`INSERT INTO chat_unread_messages(message_id,user_id,channel_id,unread_status,created_at,updated_at) VALUES(${parseInt(updatedMessageInfo.message_id)},${parseInt(messageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt('1')},"${getUTCDate()}","${getUTCDate()}")`, { type: sequelize.QueryTypes.INSERT })
                                } catch (err) {
                                    console.log("Insertation Error", err);
                                }
                            }
                        } catch (err) {
                            console.log("Unread Error", err);
                        }

                        delete updatedMessageInfo.channel_id;
                        updatedMessageInfo.channel_name = channelInfo.channel_name;
                        updatedMessageInfo.replyList = {};
                        try {
                            _.forEach(updatedMessageInfo, (item, key) => {
                                if (typeof updatedMessageInfo[key] === 'object') {
                                    updatedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(updatedMessageInfo[key]));
                                } else {
                                    updatedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, updatedMessageInfo[key].toString());
                                }
                            })
                            console.log("this is insertedMessageInfo", updatedMessageInfo);
                        } catch (err) {
                            console.log("Encryption Error", err);
                        }
                        setTimeout(function () {
                            io.in(channelInfo.channel_id).emit('send', JSON.stringify({
                                message: updatedMessageInfo
                            }))
                        })
                    } else {
                        let insertedMessageId;
                        let insertedMessageInfo;
                        try {
                            messageInfo.is_flagged = 0;
                            messageInfo.message_status = 1;
                            let insertedMessageContent = await sequelize.query(`INSERT INTO chat_messages(user_id,channel_id,chat_type,message_type,message,parent_id,filelink,thumbnail,is_edited,is_flagged,message_status,created_at,updated_at) VALUES(${parseInt(messageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt(messageInfo.chat_type)},${parseInt(messageInfo.message_type)},"${messageInfo.message}",${parseInt(messageInfo.parent_id)},"","",${parseInt(messageInfo.is_edited)},${parseInt(messageInfo.is_flagged)},${parseInt(messageInfo.message_status)},"${getUTCDate()}","${getUTCDate()}")`, { type: sequelize.QueryTypes.INSERT })
                            insertedMessageId = insertedMessageContent;
                        } catch (err) {
                            console.log("Insertation Error", err);
                        }
                        try {
                            let insertedMessageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(insertedMessageId)}`, { type: sequelize.QueryTypes.SELECT });
                            if (insertedMessageContent.length) {
                                insertedMessageInfo = insertedMessageContent[0];
                            }
                        } catch (err) {
                            console.log("Selection Error", err);
                        }

                        // unread code here : original

                        try {
                            let unreadMessageSelectionContent = await sequelize.query(`SELECT * FROM chat_unread_messages WHERE user_id = ${parseInt(messageInfo.user_id)} AND channel_id = ${parseInt(channelInfo.channel_id)}`, { type: sequelize.QueryTypes.SELECT });
                            // console.log("unreadMessageSelectionContent", unreadMessageSelectionContent)
                            if (unreadMessageSelectionContent.length) {
                                // unread exist
                                // update the unread 
                                try {
                                    let unreadMessageUpdationContent = await sequelize.query(`UPDATE chat_unread_messages SET message_id = ${parseInt(insertedMessageInfo.message_id)}, updated_at = "${getUTCDate()}" WHERE unread_id = ${parseInt(unreadMessageSelectionContent[0].unread_id)}`, { type: sequelize.QueryTypes.UPDATE });
                                } catch (err) {
                                    console.log("Updation Error", err);
                                }
                            } else {
                                // unread not exist
                                try {
                                    let unreadMessaageInsertedContent = await sequelize.query(`INSERT INTO chat_unread_messages(message_id,user_id,channel_id,unread_status,created_at,updated_at) VALUES(${parseInt(insertedMessageInfo.message_id)},${parseInt(messageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt('1')},"${getUTCDate()}","${getUTCDate()}")`, { type: sequelize.QueryTypes.INSERT })
                                } catch (err) {
                                    console.log("Insertation Error", err);
                                }
                            }
                        } catch (err) {
                            console.log("Unread Error", err);
                        }

                        delete insertedMessageInfo.channel_id;
                        insertedMessageInfo.channel_name = channelInfo.channel_name;
                        insertedMessageInfo.replyList = {};

                        try {
                            _.forEach(insertedMessageInfo, (item, key) => {
                                if (typeof insertedMessageInfo[key] === 'object') {
                                    insertedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(insertedMessageInfo[key]));
                                } else {
                                    insertedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, insertedMessageInfo[key].toString());
                                }
                            })
                            console.log("this is insertedMessageInfo", insertedMessageInfo);
                        } catch (err) {
                            console.log("Encryption Error", err);
                        }
                        setTimeout(function () {
                            io.in(channelInfo.channel_id).emit('send', JSON.stringify({
                                message: insertedMessageInfo
                            }))
                        })
                    }
                }
            } else if (messageType === CONSTANTS.MSG_TYPE_IMAGE) {
                console.log("Image Message");
                let isReply = parseInt(messageInfo.parent_id);
                if (isReply) {
                    console.log('Image Reply Message');
                    let multiMediaMessageInfo;
                    let replyMessageInfo;

                    try {
                        let messageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.SELECT });
                        multiMediaMessageInfo = messageContent[0];
                    } catch (err) {
                        console.log("Database Selection Error", err);
                    }

                    try {
                        let replyMessageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.parent_id)}`, { type: sequelize.QueryTypes.SELECT });
                        console.log("this is replyMessageContent", replyMessageContent);
                        replyMessageInfo = replyMessageContent[0];
                    } catch (err) {
                        console.log("Database Selection Error", err);
                    }

                    // unread code here
                    try {
                        let unreadMessageSelectionContent = await sequelize.query(`SELECT * FROM chat_unread_messages WHERE user_id = ${parseInt(multiMediaMessageInfo.user_id)} AND channel_id = ${parseInt(channelInfo.channel_id)}`, { type: sequelize.QueryTypes.SELECT });
                        // console.log("unreadMessageSelectionContent", unreadMessageSelectionContent)
                        if (unreadMessageSelectionContent.length) {
                            // unread exist
                            // update the unread 
                            try {
                                let unreadMessageUpdationContent = await sequelize.query(`UPDATE chat_unread_messages SET message_id = ${parseInt(multiMediaMessageInfo.message_id)}, updated_at = "${getUTCDate()}" WHERE unread_id = ${parseInt(unreadMessageSelectionContent[0].unread_id)}`, { type: sequelize.QueryTypes.UPDATE });
                            } catch (err) {
                                console.log("Updation Error", err);
                            }
                        } else {
                            // unread not exist
                            try {
                                let unreadMessaageInsertedContent = await sequelize.query(`INSERT INTO chat_unread_messages(message_id,user_id,channel_id,unread_status,created_at,updated_at) VALUES(${parseInt(multiMediaMessageInfo.message_id)},${parseInt(multiMediaMessageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt('1')},"${getUTCDate()}","${getUTCDate()}")`, { type: sequelize.QueryTypes.INSERT })
                            } catch (err) {
                                console.log("Insertation Error", err);
                            }
                        }
                    } catch (err) {
                        console.log("Unread Error", err);
                    }

                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = replyMessageInfo;

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        if (typeof multiMediaMessageInfo[key] === 'object') {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                        } else {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, multiMediaMessageInfo[key].toString());
                        }
                    })

                    io.in(channelInfo.channel_id).emit('send', JSON.stringify({
                        message: multiMediaMessageInfo
                    }));

                } else {
                    console.log('Image Message');
                    console.log(messageInfo);
                    let multiMediaMessageInfo;
                    try {
                        let messageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.SELECT });
                        multiMediaMessageInfo = messageContent[0];
                    } catch (err) {
                        console.log("Database Selection Error", err);
                    }

                    // unread message here

                    try {
                        let unreadMessageSelectionContent = await sequelize.query(`SELECT * FROM chat_unread_messages WHERE user_id = ${parseInt(multiMediaMessageInfo.user_id)} AND channel_id = ${parseInt(channelInfo.channel_id)}`, { type: sequelize.QueryTypes.SELECT });
                        // console.log("unreadMessageSelectionContent", unreadMessageSelectionContent)
                        if (unreadMessageSelectionContent.length) {
                            // unread exist
                            // update the unread 
                            try {
                                let unreadMessageUpdationContent = await sequelize.query(`UPDATE chat_unread_messages SET message_id = ${parseInt(multiMediaMessageInfo.message_id)}, updated_at = "${getUTCDate()}" WHERE unread_id = ${parseInt(unreadMessageSelectionContent[0].unread_id)}`, { type: sequelize.QueryTypes.UPDATE });
                            } catch (err) {
                                console.log("Updation Error", err);
                            }
                        } else {
                            // unread not exist
                            try {
                                let unreadMessaageInsertedContent = await sequelize.query(`INSERT INTO chat_unread_messages(message_id,user_id,channel_id,unread_status,created_at,updated_at) VALUES(${parseInt(multiMediaMessageInfo.message_id)},${parseInt(multiMediaMessageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt('1')},"${getUTCDate()}","${getUTCDate()}")`, { type: sequelize.QueryTypes.INSERT })
                            } catch (err) {
                                console.log("Insertation Error", err);
                            }
                        }
                    } catch (err) {
                        console.log("Unread Error", err);
                    }

                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = {};

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        if (typeof multiMediaMessageInfo[key] === 'object') {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                        } else {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, multiMediaMessageInfo[key].toString());
                        }
                    })

                    console.log('this is multimediamessage', multiMediaMessageInfo);

                    io.in(channelInfo.channel_id).emit('send', JSON.stringify({
                        message: multiMediaMessageInfo
                    }))
                }
            } else if (messageType === CONSTANTS.MSG_TYPE_AUDIO) {
                console.log("Audio Message");
                let isReply = parseInt(messageInfo.parent_id);
                if (isReply) {
                    console.log('Image Reply Message');
                    let multiMediaMessageInfo;
                    let replyMessageInfo;

                    try {
                        let messageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.SELECT });
                        multiMediaMessageInfo = messageContent[0];
                    } catch (err) {
                        console.log("Database Selection Error", err);
                    }

                    try {
                        let replyMessageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.parent_id)}`, { type: sequelize.QueryTypes.SELECT });
                        console.log("this is replyMessageContent", replyMessageContent);
                        replyMessageInfo = replyMessageContent[0];
                    } catch (err) {
                        console.log("Database Selection Error", err);
                    }

                    // unread code herer

                    try {
                        let unreadMessageSelectionContent = await sequelize.query(`SELECT * FROM chat_unread_messages WHERE user_id = ${parseInt(multiMediaMessageInfo.user_id)} AND channel_id = ${parseInt(channelInfo.channel_id)}`, { type: sequelize.QueryTypes.SELECT });
                        // console.log("unreadMessageSelectionContent", unreadMessageSelectionContent)
                        if (unreadMessageSelectionContent.length) {
                            // unread exist
                            // update the unread 
                            try {
                                let unreadMessageUpdationContent = await sequelize.query(`UPDATE chat_unread_messages SET message_id = ${parseInt(multiMediaMessageInfo.message_id)}, updated_at = "${getUTCDate()}" WHERE unread_id = ${parseInt(unreadMessageSelectionContent[0].unread_id)}`, { type: sequelize.QueryTypes.UPDATE });
                            } catch (err) {
                                console.log("Updation Error", err);
                            }
                        } else {
                            // unread not exist
                            try {
                                let unreadMessaageInsertedContent = await sequelize.query(`INSERT INTO chat_unread_messages(message_id,user_id,channel_id,unread_status,created_at,updated_at) VALUES(${parseInt(multiMediaMessageInfo.message_id)},${parseInt(multiMediaMessageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt('1')},"${getUTCDate()}","${getUTCDate()}")`, { type: sequelize.QueryTypes.INSERT })
                            } catch (err) {
                                console.log("Insertation Error", err);
                            }
                        }
                    } catch (err) {
                        console.log("Unread Error", err);
                    }

                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = replyMessageInfo;

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        if (typeof multiMediaMessageInfo[key] === 'object') {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                        } else {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, multiMediaMessageInfo[key].toString());
                        }
                    })

                    io.in(channelInfo.channel_id).emit('send', JSON.stringify({
                        message: multiMediaMessageInfo
                    }));

                } else {
                    console.log('Image Message');
                    console.log(messageInfo);
                    let multiMediaMessageInfo;
                    try {
                        let messageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.SELECT });
                        multiMediaMessageInfo = messageContent[0];
                    } catch (err) {
                        console.log("Database Selection Error", err);
                    }

                    // unread code here

                    try {
                        let unreadMessageSelectionContent = await sequelize.query(`SELECT * FROM chat_unread_messages WHERE user_id = ${parseInt(multiMediaMessageInfo.user_id)} AND channel_id = ${parseInt(channelInfo.channel_id)}`, { type: sequelize.QueryTypes.SELECT });
                        // console.log("unreadMessageSelectionContent", unreadMessageSelectionContent)
                        if (unreadMessageSelectionContent.length) {
                            // unread exist
                            // update the unread 
                            try {
                                let unreadMessageUpdationContent = await sequelize.query(`UPDATE chat_unread_messages SET message_id = ${parseInt(multiMediaMessageInfo.message_id)}, updated_at = "${getUTCDate()}" WHERE unread_id = ${parseInt(unreadMessageSelectionContent[0].unread_id)}`, { type: sequelize.QueryTypes.UPDATE });
                            } catch (err) {
                                console.log("Updation Error", err);
                            }
                        } else {
                            // unread not exist
                            try {
                                let unreadMessaageInsertedContent = await sequelize.query(`INSERT INTO chat_unread_messages(message_id,user_id,channel_id,unread_status,created_at,updated_at) VALUES(${parseInt(multiMediaMessageInfo.message_id)},${parseInt(multiMediaMessageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt('1')},"${getUTCDate()}","${getUTCDate()}")`, { type: sequelize.QueryTypes.INSERT })
                            } catch (err) {
                                console.log("Insertation Error", err);
                            }
                        }
                    } catch (err) {
                        console.log("Unread Error", err);
                    }

                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = {};

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        if (typeof multiMediaMessageInfo[key] === 'object') {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                        } else {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, multiMediaMessageInfo[key].toString());
                        }
                    })

                    console.log('this is multimediamessage', multiMediaMessageInfo);

                    io.in(channelInfo.channel_id).emit('send', JSON.stringify({
                        message: multiMediaMessageInfo
                    }))
                }
            } else if (messageType === CONSTANTS.MSG_TYPE_VIDEO) {
                console.log("Video Message");
                let isReply = parseInt(messageInfo.parent_id);
                if (isReply) {
                    console.log('Image Reply Message');
                    let multiMediaMessageInfo;
                    let replyMessageInfo;

                    try {
                        let messageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.SELECT });
                        multiMediaMessageInfo = messageContent[0];
                    } catch (err) {
                        console.log("Database Selection Error", err);
                    }

                    try {
                        let replyMessageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.parent_id)}`, { type: sequelize.QueryTypes.SELECT });
                        console.log("this is replyMessageContent", replyMessageContent);
                        replyMessageInfo = replyMessageContent[0];
                    } catch (err) {
                        console.log("Database Selection Error", err);
                    }

                    // unread code herer

                    try {
                        let unreadMessageSelectionContent = await sequelize.query(`SELECT * FROM chat_unread_messages WHERE user_id = ${parseInt(multiMediaMessageInfo.user_id)} AND channel_id = ${parseInt(channelInfo.channel_id)}`, { type: sequelize.QueryTypes.SELECT });
                        // console.log("unreadMessageSelectionContent", unreadMessageSelectionContent)
                        if (unreadMessageSelectionContent.length) {
                            // unread exist
                            // update the unread 
                            try {
                                let unreadMessageUpdationContent = await sequelize.query(`UPDATE chat_unread_messages SET message_id = ${parseInt(multiMediaMessageInfo.message_id)}, updated_at = "${getUTCDate()}" WHERE unread_id = ${parseInt(unreadMessageSelectionContent[0].unread_id)}`, { type: sequelize.QueryTypes.UPDATE });
                            } catch (err) {
                                console.log("Updation Error", err);
                            }
                        } else {
                            // unread not exist
                            try {
                                let unreadMessaageInsertedContent = await sequelize.query(`INSERT INTO chat_unread_messages(message_id,user_id,channel_id,unread_status,created_at,updated_at) VALUES(${parseInt(multiMediaMessageInfo.message_id)},${parseInt(multiMediaMessageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt('1')},"${getUTCDate()}","${getUTCDate()}")`, { type: sequelize.QueryTypes.INSERT })
                            } catch (err) {
                                console.log("Insertation Error", err);
                            }
                        }
                    } catch (err) {
                        console.log("Unread Error", err);
                    }

                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = replyMessageInfo;

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        if (typeof multiMediaMessageInfo[key] === 'object') {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                        } else {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, multiMediaMessageInfo[key].toString());
                        }
                    })

                    io.in(channelInfo.channel_id).emit('send', JSON.stringify({
                        message: multiMediaMessageInfo
                    }))

                } else {
                    console.log('Image Message');
                    console.log(messageInfo);
                    let multiMediaMessageInfo;
                    try {
                        let messageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.SELECT });
                        multiMediaMessageInfo = messageContent[0];
                    } catch (err) {
                        console.log("Database Selection Error", err);
                    }

                    // unread code hrer

                    try {
                        let unreadMessageSelectionContent = await sequelize.query(`SELECT * FROM chat_unread_messages WHERE user_id = ${parseInt(multiMediaMessageInfo.user_id)} AND channel_id = ${parseInt(channelInfo.channel_id)}`, { type: sequelize.QueryTypes.SELECT });
                        // console.log("unreadMessageSelectionContent", unreadMessageSelectionContent)
                        if (unreadMessageSelectionContent.length) {
                            // unread exist
                            // update the unread 
                            try {
                                let unreadMessageUpdationContent = await sequelize.query(`UPDATE chat_unread_messages SET message_id = ${parseInt(multiMediaMessageInfo.message_id)}, updated_at = "${getUTCDate()}" WHERE unread_id = ${parseInt(unreadMessageSelectionContent[0].unread_id)}`, { type: sequelize.QueryTypes.UPDATE });
                            } catch (err) {
                                console.log("Updation Error", err);
                            }
                        } else {
                            // unread not exist
                            try {
                                let unreadMessaageInsertedContent = await sequelize.query(`INSERT INTO chat_unread_messages(message_id,user_id,channel_id,unread_status,created_at,updated_at) VALUES(${parseInt(multiMediaMessageInfo.message_id)},${parseInt(multiMediaMessageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt('1')},"${getUTCDate()}","${getUTCDate()}")`, { type: sequelize.QueryTypes.INSERT })
                            } catch (err) {
                                console.log("Insertation Error", err);
                            }
                        }
                    } catch (err) {
                        console.log("Unread Error", err);
                    }

                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = {};

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        if (typeof multiMediaMessageInfo[key] === 'object') {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                        } else {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, multiMediaMessageInfo[key].toString());
                        }
                    })

                    console.log('this is multimediamessage', multiMediaMessageInfo);

                    io.in(channelInfo.channel_id).emit('send', JSON.stringify({
                        message: multiMediaMessageInfo
                    }));
                }
            } else if (messageType === CONSTANTS.MSG_TYPE_DOCS) {
                let isReply = parseInt(messageInfo.parent_id);
                if (isReply) {
                    console.log('Image Reply Message');
                    let multiMediaMessageInfo;
                    let replyMessageInfo;
                    try {
                        let messageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.SELECT });
                        multiMediaMessageInfo = messageContent[0];
                    } catch (err) {
                        console.log("Database Selection Error", err);
                    }
                    try {
                        let replyMessageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.parent_id)}`, { type: sequelize.QueryTypes.SELECT });
                        console.log("this is replyMessageContent", replyMessageContent);
                        replyMessageInfo = replyMessageContent[0];
                    } catch (err) {
                        console.log("Database Selection Error", err);
                    }
                    // unread code here
                    try {
                        let unreadMessageSelectionContent = await sequelize.query(`SELECT * FROM chat_unread_messages WHERE user_id = ${parseInt(multiMediaMessageInfo.user_id)} AND channel_id = ${parseInt(channelInfo.channel_id)}`, { type: sequelize.QueryTypes.SELECT });
                        // console.log("unreadMessageSelectionContent", unreadMessageSelectionContent)
                        if (unreadMessageSelectionContent.length) {
                            // unread exist
                            // update the unread 
                            try {
                                let unreadMessageUpdationContent = await sequelize.query(`UPDATE chat_unread_messages SET message_id = ${parseInt(multiMediaMessageInfo.message_id)}, updated_at = "${getUTCDate()}" WHERE unread_id = ${parseInt(unreadMessageSelectionContent[0].unread_id)}`, { type: sequelize.QueryTypes.UPDATE });
                            } catch (err) {
                                console.log("Updation Error", err);
                            }
                        } else {
                            // unread not exist
                            try {
                                let unreadMessaageInsertedContent = await sequelize.query(`INSERT INTO chat_unread_messages(message_id,user_id,channel_id,unread_status,created_at,updated_at) VALUES(${parseInt(multiMediaMessageInfo.message_id)},${parseInt(multiMediaMessageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt('1')},"${getUTCDate()}","${getUTCDate()}")`, { type: sequelize.QueryTypes.INSERT })
                            } catch (err) {
                                console.log("Insertation Error", err);
                            }
                        }
                    } catch (err) {
                        console.log("Unread Error", err);
                    }
                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = replyMessageInfo;
                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        if (typeof multiMediaMessageInfo[key] === 'object') {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                        } else {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, multiMediaMessageInfo[key].toString());
                        }
                    })
                    io.in(channelInfo.channel_id).emit('send', JSON.stringify({
                        message: multiMediaMessageInfo
                    }));
                } else {
                    console.log('Image Message');
                    console.log(messageInfo);
                    let multiMediaMessageInfo;
                    try {
                        let messageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.SELECT });
                        multiMediaMessageInfo = messageContent[0];
                    } catch (err) {
                        console.log("Database Selection Error", err);
                    }
                    // unread code hrer
                    try {
                        let unreadMessageSelectionContent = await sequelize.query(`SELECT * FROM chat_unread_messages WHERE user_id = ${parseInt(multiMediaMessageInfo.user_id)} AND channel_id = ${parseInt(channelInfo.channel_id)}`, { type: sequelize.QueryTypes.SELECT });
                        // console.log("unreadMessageSelectionContent", unreadMessageSelectionContent)
                        if (unreadMessageSelectionContent.length) {
                            // unread exist
                            // update the unread 
                            try {
                                let unreadMessageUpdationContent = await sequelize.query(`UPDATE chat_unread_messages SET message_id = ${parseInt(multiMediaMessageInfo.message_id)}, updated_at = "${getUTCDate()}" WHERE unread_id = ${parseInt(unreadMessageSelectionContent[0].unread_id)}`, { type: sequelize.QueryTypes.UPDATE });
                            } catch (err) {
                                console.log("Updation Error", err);
                            }
                        } else {
                            // unread not exist
                            try {
                                let unreadMessaageInsertedContent = await sequelize.query(`INSERT INTO chat_unread_messages(message_id,user_id,channel_id,unread_status,created_at,updated_at) VALUES(${parseInt(multiMediaMessageInfo.message_id)},${parseInt(multiMediaMessageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt('1')},"${getUTCDate()}","${getUTCDate()}")`, { type: sequelize.QueryTypes.INSERT })
                            } catch (err) {
                                console.log("Insertation Error", err);
                            }
                        }
                    } catch (err) {
                        console.log("Unread Error", err);
                    }
                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = {};

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        if (typeof multiMediaMessageInfo[key] === 'object') {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                        } else {
                            multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, multiMediaMessageInfo[key].toString());
                        }
                    })
                    console.log('this is multimediamessage', multiMediaMessageInfo);
                    io.in(channelInfo.channel_id).emit('send', JSON.stringify({
                        message: multiMediaMessageInfo
                    }));
                }
            }
        }
    })


    // socket.on('user_channel status', async function (data) {
    //     console.log('user_channel is called by ', socket.id);
    //     let messageInfo;
    //     try {
    //         messageInfo = JSON.parse(data);
    //     } catch (err) {
    //         console.log("Parsing Error", err);
    //     }
    //     try {
    //         _.forEach(messageInfo, (value, key) => {
    //             messageInfo[key] = Encryptor.aesDecryption(process.env.ENCRYPT_KEY, messageInfo[key]);
    //         })
    //     } catch (err) {
    //         console.log("Parsing Error", err);
    //     }

    //     let userId = messageInfo.user_id;
    //     let userStatus = messageInfo.user_status;
    //     let channelName = messageInfo.channel_name;

    //     let channelContent;
    //     try {
    //         let channelContentList = await channelsService.findChannel({ channel_name: channelName });
    //         channelContent = channelContentList;
    //     } catch (err) {
    //         console.log('this is error from channelContent', err);
    //     }

    //     let selectedUserChannelContent;
    //     try {
    //         selectedUserChannelContent = await userChannelStatusService.findUserChannelStatusByUserIdChannelId(parseInt(userId), parseInt(channelContent.channel_id));
    //         console.log("this is selectedUserChannelConetent", selectedUserChannelContent);
    //     } catch (err) {
    //         console.log("UserChannelStatus Fetching Error", err);
    //     }
    //     try {
    //         if (selectedUserChannelContent) {
    //             // exist
    //             try {
    //                 let updatedUserChannelStatusContent = await userChannelStatusService.updateUserChannelStatus(parseInt(userId), parseInt(channelContent.channel_id), parseInt('1'));
    //             } catch (err) {
    //                 console.log("UserChannelStatus Updation Error", err);
    //             }
    //         } else {
    //             // not exist
    //             try {
    //                 userchannelobj = {
    //                     user_id: parseInt(userId),
    //                     channel_id: parseInt(channelContent.channel_id),
    //                     user_channel_status: parseInt('1')
    //                 }
    //                 let insertedUserChannelContent = await userChannelStatusService.createUserChannelStatus(userchannelobj);
    //                 if (insertedUserChannelContent) {
    //                 }
    //             } catch (err) {
    //                 console.log("UserChannelStatus Insertation Error", err);
    //             }
    //         }
    //     } catch (err) {
    //         console.log("UserChannelUpdationError", err);
    //     }

    //     try {
    //         // find all users in this channel and then check for each user's status
    //         try {
    //             let channelUsersContent = channelUsersService.findChannelUsers(parseInt(channelContent.channel_id));
    //             console.log("channelUsersContent", channelUsersContent);
    //         } catch (err) {
    //             console.log("")
    //         }
    //     } catch (err) {
    //         console.log("");
    //     }
    // })



    socket.on('user status', async function (data) {
        console.log('user status is called by ', socket.id);
        let messageInfo;
        try {
            messageInfo = JSON.parse(data);
        } catch (err) {
            console.log("Parsing Error", err);
        }
        try {
            _.forEach(messageInfo, (value, key) => {
                messageInfo[key] = Encryptor.aesDecryption(process.env.ENCRYPT_KEY, messageInfo[key]);
            })
        } catch (err) {
            console.log("Parsing Error", err);
        }

        let userId = messageInfo.user_id;
        let userStatus = messageInfo.user_status;

        try {
            let selectedMessageContent = await userStatusService.findUserStatusByUserId(userId);
            console.log('this is insertedMessageContent', selectedMessageContent);
            if (selectedMessageContent.length) {
                // already exist
                try {
                    let updateUserStatusContent = await userStatusService.updateUserStatus(userId, userStatus);
                    console.log(updateUserStatusContent);
                    // if (updateUserStatusContent) {
                    // return res.json(new responseObj("Successfully Updated", 200, true));

                    _.forEach(updateUserStatusContent, (value, key) => {
                        if (typeof updateUserStatusContent[key] === 'object') {
                            updateUserStatusContent[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(updateUserStatusContent[key]));
                        } else {
                            updateUserStatusContent[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, updateUserStatusContent.toString());
                        }
                    })
                    io.emit('user status', JSON.stringify({
                        user_status: updateUserStatusContent
                    }))
                    // }
                } catch (err) {
                    console.log("Updation Error", err);
                }
            } else {
                // new entry
                try {
                    userstatuobj = {
                        user_id: userId,
                        user_status: userStatus
                    }
                    let insertedMessageContent = await userStatusService.createUserStatus(userstatuobj);
                    // console.log('this is insertedMessageContent', insertedMessageContent);
                    if (insertedMessageContent) {
                        // return res.json(new responseObj("Successfully Updated", 200, true));

                        _.forEach(insertedMessageContent, (value, key) => {
                            if (typeof insertedMessageContent[key] === 'object') {
                                insertedMessageContent[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(insertedMessageContent[key]));
                            } else {
                                insertedMessageContent[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, insertedMessageContent[key].toString());
                            }
                        })
                        io.emit('user status', JSON.stringify({
                            user_status: insertedMessageContent
                        }))
                    }
                } catch (err) {
                    console.log("Insertation Error", err);
                }
            }
        } catch (err) {
            return res.json(new responseObj("Internal Server Error", 500, false));
            console.log("Insertation Error", err);
        }
    })


    socket.on('delete message', async function (data) {
        console.log('delete message is called by ', socket.id);
        let messageInfo;
        let updatedMessageInfo;
        try {
            messageInfo = JSON.parse(data);
        } catch (err) {
            console.log("Parsing Error", err);
        }
        try {
            _.forEach(messageInfo, (value, key) => {
                messageInfo[key] = Encryptor.aesDecryption(process.env.ENCRYPT_KEY, messageInfo[key]);
            })
        } catch (err) {
            console.log("Decryption Error", err);
        }
        let channelInfo;
        if (messageInfo.channel_name) {
            try {
                channelInfo = await channelsService.findChannel({ channel_name: messageInfo.channel_name })
                // console.log('this is channelInfo', channelInfo);
            } catch (err) {
                console.log("Channel Fetching Error", err);
            }
        } else {
            try {
                channelInfo = await channelsService.findChannelById(parseInt(messageInfo.channel_id));
            } catch (err) {
                console.log("Channel Fetching Error", err);
            }
        }
        try {
            let messageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.SELECT });
            messageInfo = messageContent[0];
        } catch (err) {
            console.log("this is error ", err);
        }
        if (parseInt(messageInfo.user_id) === parseInt(messageInfo.user_id)) {
            try {
                let deleteMessageContent = await sequelize.query(`UPDATE chat_messages SET message_status = 0 WHERE message_id = ${parseInt(messageInfo.message_id)} `, { type: sequelize.QueryTypes.DELETE });
            } catch (err) {
                console.log("Database Updation Error", err);
            }
            try {
                let updatedMessageContent = await sequelize.query(`SELECT * FROM chat_messages WHERE message_id = ${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.SELECT });
                updatedMessageInfo = updatedMessageContent[0];
            } catch (err) {
                console.log("Database Selection Error", err);
            }
            _.forEach(updatedMessageInfo, (value, key) => {
                if (typeof updatedMessageInfo[key] === 'object') {
                    updatedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(updatedMessageInfo[key]));
                } else {
                    updatedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, updatedMessageInfo[key].toString());
                }
            })
            io.in(channelInfo.channel_id).emit('delete', JSON.stringify({
                message: updatedMessageInfo
            }));
            console.log('updated message', updatedMessageInfo);
        }
    });

    socket.on('show clients', function () {
        io.clients((error, clients) => {
            if (error)
                throw error;
            console.log('these are the all connected clients', clients);
            io.emit('show clients', {
                clients: clients
            })
        })
    });

    socket.on('show rooms', function () {
        console.log('these are the rooms on socket server', io.sockets.adapter.rooms);
        io.emit("show rooms", {
            rooms: io.sockets.adapter.rooms
        })
    })

    socket.on('disconnect', function (reason) {
        console.log('disconnected user', socket.id);
        console.log('a user disconnected', reason);
    });

    socket.on('error', function (error) {
        console.log(`this is error in socket, ${socket.id}, ${error}`);
    })

})