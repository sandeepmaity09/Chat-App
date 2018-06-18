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


app.get('/', function (req, res) {
    // res.end("Socket Connected!");
    console.log('socket connected');
    res.sendfile('index.html', {
        root: __dirname
    });
});

io.on('connection', async function (socket) {
    console.log('A new user connected', socket.id);

    //////////////////////////////////////////////////////////////
    // "join channel" :- when user join a channel for first time
    //////////////////////////////////////////////////////////////

    // socket.on('join group', async function (data) {
    //     console.log('join user called by the socket user', socket.id);
    //     console.log('this is data received at join user', data);
    //     let userData;
    //     try {
    //         userData = JSON.parse(data);
    //         console.log(userData);
    //     } catch (err) {
    //         console.log('app crashed at join user', data);
    //         process.exit(1);
    //     }
    //     let userId = userData.user_id;
    //     let groupId = userData.group_id;
    //     let userObject = {
    //         user_id: user_id,
    //         group_id: group_id,
    //         type: 'join'
    //     }
    //     setTimeout(function () {
    //         socket.broadcast.emit('join', {
    //             user: userObject
    //         })
    //     })
    //     io.emit('joinandroid', {
    //         user: userObject
    //     })
    // })

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
    // "switch group" :- when user changes a group (channel)
    //////////////////////////////////////////////////////////

    socket.on('switch group', function (groupdata) {
        console.log('switch group called by the socket user', socket.id);
        let newgroup;
        try {
            newgroup = JSON.parse(groupdata);
        } catch (err) {
            console.log('app crashed at switch group', err);
        }
    })


    /////////////////////////////////////////////////////////////
    // "leave group" :- when user leaves a group ( before switch)
    /////////////////////////////////////////////////////////////

    socket.on('leave group', async function (leavepacket) {
        console.log("leave group called by the socket user ", socket.id);
        let room;
        try {
            room = JSON.parse(leavepacket);
            console.log("Now I m leaving group", leavepacket);
        } catch (err) {
            console.log("app crashed at leave room", err);
            process.exit(1);
        }
        socket.leave(room.room_id);
    })


    //////////////////////////////////////////////////////////////
    // "send message" :- when user send messages through sockets
    //////////////////////////////////////////////////////////////

    socket.on('send message', async function (data) {
        console.log("send message called by socket user", socket.id);
        console.log("socket user is connected to these rooms", socket.rooms);
        console.log("this is received payload from client", data);
        let payload = JSON.parse(data);

        const channelId = payload.channel_id;

        let chatType = payload.chat_type;


        if (chatType) {
            // ONE To ONE Chat
        } else {
            // Group Chat
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