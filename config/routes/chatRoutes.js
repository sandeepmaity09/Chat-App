const express = require('express');
const multer = require('multer');
const _ = require('underscore');
const axios = require('axios');

const ChatController = require('../../api/controllers/ChatController')();
const authKeyValidator = require('../handlers/authHandler').authKeyValidator;
const tokenValidator = require('../handlers/authHandler').tokenValidator;

const ChatRoutes = express.Router();
const formDataParser = multer();
const FileInsertController = require('../../api/controllers/FileController');

ChatRoutes.post('/createChannel', formDataParser.array(), authKeyValidator, tokenValidator, ChatController.createChannel);
ChatRoutes.post('/joinChannel', formDataParser.array(), authKeyValidator, tokenValidator, ChatController.joinChannel);
ChatRoutes.post('/leaveChannel', formDataParser.array(), authKeyValidator, tokenValidator, ChatController.leaveChannel);

ChatRoutes.post('/chatHistory', formDataParser.array(), authKeyValidator, tokenValidator, ChatController.chatHistory);
ChatRoutes.post('/chatInsert', FileInsertController.upload.single('file'), authKeyValidator, tokenValidator, ChatController.chatInsert);

ChatRoutes.post('/updateUserStatus', formDataParser.array(), authKeyValidator, tokenValidator, ChatController.setUserStatus);

ChatRoutes.post('/encrypt', formDataParser.array(), ChatController.aesEncryptor);
ChatRoutes.post('/decrypt', formDataParser.array(), ChatController.aesDecryptor);

module.exports = ChatRoutes;