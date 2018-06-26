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
 * Static Resource Sharing
 */
// app.use('/public', express.static(path.join(__dirname + '/public')));

/**
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

/**
 * Services 
 */
const channelsService = require('../api/services/db/channels.service')();
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
    // io.emit('connect', JSON.stringify({
    //     socketID: socket.id
    // }))
    // socket.emit('connection', JSON.stringify({
    //     socketID: socket.id
    // }))
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
        } catch (err) {
            console.log('this is error from channelContent', err);
        }

        _.forEach(io.sockets.adapter.sids[socket.id], (item) => {
            if (item == socket.id || item == channelContent.channel_id) {

            } else {
                socket.leave(item);
            }
        })
        socket.join(channelContent.channel_id);

        let channelUserPayload = {
            user_id: Encryptor.aesEncryption(process.env.ENCRYPT_KEY, userId),
            channel_name: Encryptor.aesEncryption(process.env.ENCRYPT_KEY, channelName)
        }

        console.log('this is channel payload', channelUserPayload);

        setTimeout(function () {
            io.in(channelContent.channel_id).emit('join', {
                payload: channelUserPayload
            })
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
        } catch (err) {
            console.log('this is error from channelContent', err);
        }

        _.forEach(io.sockets.adapter.sids[socket.id], (item) => {
            if (item == socket.id || item == channelContent.channel_id) {

            } else {
                socket.leave(item);
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

        _.forEach(io.sockets.adapter.sids[socket.id], (item) => {
            if (item == socket.id || item == channelContent.channel_id) {

            } else {
                socket.leave(item);
            }
        })
        socket.leave(channelContent.channel_id);
    })


    //////////////////////////////////////////////////////////////
    // "send message" :- when user send messages through sockets
    //////////////////////////////////////////////////////////////

    socket.on('send message', async function (data) {
        console.log("send message is called by socket id", socket.id);
        // console.log("send message called by socket user", socket.id);
        // console.log("socket user is connected to these rooms", socket.rooms);
        // console.log("this is received payload from client", data);

        let messageInfo;
        try {
            messageInfo = JSON.parse(data);
        } catch (err) {
            console.log("Parsing Error", err);
        }

        // console.log('this is messageInfo before parsing', messageInfo);

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
        // console.log(messageType);


        let channelInfo;
        // console.log(messageInfo.channel_name);
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

        if (chatType) {
            // ONE To ONE Chat
            console.log('ONE TO ONE CHAT');
            if (messageType === 0) {
                console.log("TEXT MESSAGE");
                let isReply = parseInt(messageInfo.parent_id);
                if (isReply) {
                    console.log("This is Reply");
                    let insertedMessageId;
                    let insertedMessageInfo;
                    if (messageInfo.is_edited === 0) {
                        try {
                            messageInfo.is_edited = 0;
                            messageInfo.is_flagged = 0;
                            messageInfo.message_status = 0;
                            let insertedMessageContent = await sequelize.query(`INSERT INTO chat_messages(user_id,channel_id,chat_type,message_type,message,parent_id,is_edited,is_flagged,message_status,created_at,updated_at) VALUES(${parseInt(messageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt(messageInfo.chat_type)},${parseInt(messageInfo.message_type)},"${messageInfo.message}",${parseInt(messageInfo.parent_id)},${parseInt(messageInfo.is_edited)},${parseInt(messageInfo.is_flagged)},${parseInt(messageInfo.message_status)},"${messageInfo.created_at}","${messageInfo.updated_at}")`, { type: sequelize.QueryTypes.INSERT })
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
                            _.forEach(insertedMessageInfo, (item, key) => {
                                if (item !== null) {
                                    insertedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(insertedMessageInfo[key]));
                                } else {
                                    delete insertedMessageInfo[key];
                                }
                            })
                            console.log("this is insertedMessageInfo", insertedMessageInfo);
                        } catch (err) {
                            console.log("Encryption Error", err);
                        }

                        console.log('Message send to ', channelInfo.channel_id);

                        setTimeout(function () {
                            io.in(channelInfo.channel_id).emit('send', {
                                message: insertedMessageInfo
                            })
                        })
                    } else {
                        try {
                            messageInfo.is_edited = 0;
                            messageInfo.is_flagged = 0;
                            messageInfo.message_status = 0;
                            let insertedMessageContent = await sequelize.query(`INSERT INTO chat_messages(user_id,channel_id,chat_type,message_type,message,parent_id,is_edited,is_flagged,message_status,created_at,updated_at) VALUES(${parseInt(messageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt(messageInfo.chat_type)},${parseInt(messageInfo.message_type)},"${messageInfo.message}",${parseInt(messageInfo.parent_id)},${parseInt(messageInfo.is_edited)},${parseInt(messageInfo.is_flagged)},${parseInt(messageInfo.message_status)},"${messageInfo.created_at}","${messageInfo.updated_at}")`, { type: sequelize.QueryTypes.INSERT })
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
                            _.forEach(insertedMessageInfo, (item, key) => {
                                if (item !== null) {
                                    insertedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(insertedMessageInfo[key]));
                                } else {
                                    delete insertedMessageInfo[key];
                                }
                            })
                            console.log("this is insertedMessageInfo", insertedMessageInfo);
                        } catch (err) {
                            console.log("Encryption Error", err);
                        }

                        console.log('Message send to ', channelInfo.channel_id);

                        setTimeout(function () {
                            io.in(channelInfo.channel_id).emit('send', {
                                message: insertedMessageInfo
                            })
                        })
                    }
                } else {
                    console.log("This is Just Text Message");
                    let insertedMessageId;
                    let insertedMessageInfo;
                    try {
                        messageInfo.is_flagged = 0;
                        messageInfo.is_deleted = 0;
                        let insertedMessageContent = await sequelize.query(`INSERT INTO chat_messages(user_id,channel_id,chat_type,message_type,message,parent_id,is_flagged,is_deleted,created_at) VALUES(${parseInt(messageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt(messageInfo.chat_type)},${parseInt(messageInfo.message_type)},"${messageInfo.message}",${parseInt(messageInfo.parent_id)},${parseInt(messageInfo.is_flagged)},${parseInt(messageInfo.is_deleted)},"${messageInfo.created_at}")`, { type: sequelize.QueryTypes.INSERT })
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
                        _.forEach(insertedMessageInfo, (item, key) => {
                            if (item !== null) {
                                insertedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(insertedMessageInfo[key]));
                            } else {
                                delete insertedMessageInfo[key];
                            }
                        })
                        console.log("this is insertedMessageInfo", insertedMessageInfo);
                    } catch (err) {
                        console.log("Encryption Error", err);
                    }

                    console.log('Message send to ', channelInfo.channel_id);

                    setTimeout(function () {
                        io.in(channelInfo.channel_id).emit('send', {
                            message: insertedMessageInfo
                        })
                    })
                }
            } else if (messageType === 1) {
                console.log("Image Message");
            } else if (messageType === 2) {
                console.log("Audio Message");
            } else if (messageType === 3) {
                console.log("Video Message");
            } else if (messageType === 4) {
                console.log("Docs Message");
            }
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
                            let updatedMessageContent = await sequelize.query(`UPDATE chat_messages SET message="${messageInfo.message}",is_edited=${parseInt(messageInfo.is_edited)},updated_at="${messageInfo.updated_at}" WHERE message_id=${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.UPDATE });
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
                        updatedMessageInfo.replyList = [replyMessageInfo];
                        try {
                            _.forEach(updatedMessageInfo, (item, key) => {
                                if (item !== null) {
                                    updatedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(updatedMessageInfo[key]));
                                } else {
                                    delete updatedMessageInfo[key];
                                }
                            })
                            console.log("this is insertedMessageInfo", updatedMessageInfo);
                        } catch (err) {
                            console.log("Encryption Error", err);
                        }
                        setTimeout(function () {
                            io.in(channelInfo.channel_id).emit('send', {
                                message: updatedMessageInfo
                            })
                        })
                    } else {
                        let insertedMessageId;
                        let insertedMessageInfo;
                        let replyMessageInfo;
                        try {
                            messageInfo.is_flagged = 0;
                            messageInfo.message_status = 0;
                            let insertedMessageContent = await sequelize.query(`INSERT INTO chat_messages(user_id,channel_id,chat_type,message_type,message,parent_id,filelink,thumbnail,is_edited,is_flagged,message_status,created_at,updated_at) VALUES(${parseInt(messageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt(messageInfo.chat_type)},${parseInt(messageInfo.message_type)},"${messageInfo.message}",${parseInt(messageInfo.parent_id)},"","",${parseInt(messageInfo.is_edited)},${parseInt(messageInfo.is_flagged)},${parseInt(messageInfo.message_status)},"${messageInfo.created_at}","${messageInfo.updated_at}")`, { type: sequelize.QueryTypes.INSERT })
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
                        insertedMessageInfo.replyList = [replyMessageInfo];
                        try {
                            _.forEach(insertedMessageInfo, (item, key) => {
                                if (item !== null) {
                                    insertedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(insertedMessageInfo[key]));
                                } else {
                                    delete insertedMessageInfo[key];
                                }
                            })
                            console.log("this is insertedMessageInfo", insertedMessageInfo);
                        } catch (err) {
                            console.log("Encryption Error", err);
                        }
                        setTimeout(function () {
                            io.in(channelInfo.channel_id).emit('send', {
                                message: insertedMessageInfo
                            })
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
                            let updatedMessageContent = await sequelize.query(`UPDATE chat_messages SET message="${messageInfo.message}",is_edited=${parseInt(messageInfo.is_edited)},updated_at="${messageInfo.updated_at}" WHERE message_id=${parseInt(messageInfo.message_id)}`, { type: sequelize.QueryTypes.UPDATE });
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
                        updatedMessageInfo.replyList = [];
                        try {
                            _.forEach(updatedMessageInfo, (item, key) => {
                                if (item !== null) {
                                    updatedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(updatedMessageInfo[key]));
                                } else {
                                    delete updatedMessageInfo[key];
                                }
                            })
                            console.log("this is insertedMessageInfo", updatedMessageInfo);
                        } catch (err) {
                            console.log("Encryption Error", err);
                        }
                        setTimeout(function () {
                            io.in(channelInfo.channel_id).emit('send', {
                                message: updatedMessageInfo
                            })
                        })
                    } else {
                        let insertedMessageId;
                        let insertedMessageInfo;
                        try {
                            messageInfo.is_flagged = 0;
                            messageInfo.message_status = 0;
                            let insertedMessageContent = await sequelize.query(`INSERT INTO chat_messages(user_id,channel_id,chat_type,message_type,message,parent_id,filelink,thumbnail,is_edited,is_flagged,message_status,created_at,updated_at) VALUES(${parseInt(messageInfo.user_id)},${parseInt(channelInfo.channel_id)},${parseInt(messageInfo.chat_type)},${parseInt(messageInfo.message_type)},"${messageInfo.message}",${parseInt(messageInfo.parent_id)},"","",${parseInt(messageInfo.is_edited)},${parseInt(messageInfo.is_flagged)},${parseInt(messageInfo.message_status)},"${messageInfo.created_at}","${messageInfo.updated_at}")`, { type: sequelize.QueryTypes.INSERT })
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
                        insertedMessageInfo.replyList = [];

                        try {
                            _.forEach(insertedMessageInfo, (item, key) => {
                                if (item !== null) {
                                    insertedMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(insertedMessageInfo[key]));
                                } else {
                                    delete insertedMessageInfo[key];
                                }
                            })
                            console.log("this is insertedMessageInfo", insertedMessageInfo);
                        } catch (err) {
                            console.log("Encryption Error", err);
                        }
                        setTimeout(function () {
                            io.in(channelInfo.channel_id).emit('send', {
                                message: insertedMessageInfo
                            })
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

                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = replyMessageInfo;

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                    })

                    io.in(channelInfo.channel_id).emit('send', {
                        message: multiMediaMessageInfo
                    })

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


                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = [];

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                    })

                    console.log('this is multimediamessage', multiMediaMessageInfo);

                    io.in(channelInfo.channel_id).emit('send', {
                        message: multiMediaMessageInfo
                    })
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

                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = replyMessageInfo;

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                    })

                    io.in(channelInfo.channel_id).emit('send', {
                        message: multiMediaMessageInfo
                    })

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


                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = [];

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                    })

                    console.log('this is multimediamessage', multiMediaMessageInfo);

                    io.in(channelInfo.channel_id).emit('send', {
                        message: multiMediaMessageInfo
                    })
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

                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = replyMessageInfo;

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                    })

                    io.in(channelInfo.channel_id).emit('send', {
                        message: multiMediaMessageInfo
                    })

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


                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = [];

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                    })

                    console.log('this is multimediamessage', multiMediaMessageInfo);

                    io.in(channelInfo.channel_id).emit('send', {
                        message: multiMediaMessageInfo
                    })
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

                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = replyMessageInfo;

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                    })

                    io.in(channelInfo.channel_id).emit('send', {
                        message: multiMediaMessageInfo
                    })

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


                    delete multiMediaMessageInfo.channel_id;
                    multiMediaMessageInfo.channel_name = channelInfo.channel_name;
                    multiMediaMessageInfo.replyList = [];

                    _.forEach(multiMediaMessageInfo, (value, key) => {
                        multiMediaMessageInfo[key] = Encryptor.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(multiMediaMessageInfo[key]));
                    })

                    console.log('this is multimediamessage', multiMediaMessageInfo);

                    io.in(channelInfo.channel_id).emit('send', {
                        message: multiMediaMessageInfo
                    })
                }
            }
        }


    })

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