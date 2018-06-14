const express = require('express');
const multer = require('multer');
const _ = require('underscore');
const axios = require('axios');

const ChatController = require('../../api/controllers/ChatController')();

const ChatRoutes = express.Router();
const formDataParser = multer();

ChatRoutes.post('/createGroup', formDataParser.array(), ChatController.createGroup);

module.exports = ChatRoutes;