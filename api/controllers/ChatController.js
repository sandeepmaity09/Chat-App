const _ = require('underscore');
const axios = require('axios');

const responseObj = require('../helpers/responseObj');

const groupService = require('../services/db/group.service')();

const ChatController = () => {

    async function createGroup(req, res) {
        console.log(req.body);
        console.log('this is req.body');
        // groupService.createGroup()
    }
    return {
        createGroup
    }
}

module.exports = ChatController;