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



app.get('/', function (req, res) {
    // res.end("Socket Connected!");
    console.log('socket connected');
    res.sendfile('index.html', {
        root: __dirname
    });
});

io.on('connection', async function (socket) {
    console.log('A new user connected', socket.id);

    // socket.on('join user', async function (data) {

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

    // socket.on('switch group', function (groupdata) {
    //     console.log('switch group called by the socket user', socket.id);
    //     let newgroup;
    //     try {
    //         newgroup = JSON.parse(groupdata);
    //     } catch (err) {
    //         console.log('app crashed at switch group', err);
    //     }
    // })

    // socket.on('leave group', async function (leavepacket) {
    //     console.log("leave group called by the socket user ", socket.id);
    //     let room;
    //     try {
    //         room = JSON.parse(leavepacket);
    //         console.log("Now I m leaving group", leavepacket);
    //     } catch (err) {
    //         console.log("app crashed at leave room", err);
    //         process.exit(1);
    //     }
    //     socket.leave(room.room_id);
    // })




    socket.on('send message', async function (data) {
        console.log("send message called by socket user", socket.id);
        console.log("socket user is connected to these rooms", socket.rooms);
        console.log("this is received payload from client", data);

        let payload = JSON.parse(data);


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