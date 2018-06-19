const _ = require('underscore');
const axios = require('axios');

const responseObj = require('../helpers/responseObj');
const Encrypter = require('../helpers/aesHelpers');

const channelsService = require('../services/db/channels.service')();
const channelUsersService = require('../services/db/channelUsers.service')();



let key = process.env.ENCRYPT_KEY;

const ChatController = () => {

    async function aesEncryptor(req, res) {
        return res.json(Encrypter.aesEncryption(key, req.body.name));
    }

    async function aesDecryptor(req, res) {
        return res.json(Encrypter.aesDecryption(key, req.body.name));
    }

    async function createChannel(req, res) {
        let channelName;
        try {
            channelName = Encrypter.aesDecryption(key, req.body.channel_name);
            // console.log('this is channel Name', channelName);
        } catch (err) {
            console.log('this is error from channel Name decoder', err);
        }

        if (!channelName) {
            return res.json(new responseObj('channel_name is not provided, BAD REQUEST', 400, false));
        }

        let channelInfo;

        let channel = {
            channel_name: channelName
        }

        try {
            let channelContent = await channelsService.findOrCreateChannel(channel);
            console.log('this is channelContent', channelContent);
            if (channelContent[1]) {
                try {
                    let tempContent = await channelsService.findOrCreateChannel(channel);
                    channelInfo = tempContent[0];
                } catch (err) {
                    console.log('this is error form createGroup, groupData inner', err);
                }
                return res.json(new responseObj('new channel successfully created', 200, true, channelInfo))
            } else {
                return res.json(new responseObj('channel already exist', 400, false));
            }
        } catch (err) {
            console.log('this is error from createGroup, groupData', err);
            return res.json(new responseObj('Internal Server Error', 500, false));
        }
    }

    async function leaveChannel(req, res) {
        let channelName = req.body.channel_name;
        let userId = req.body.user_id;

        if (!userId) {
            return res.json(new responseObj('user_id not provided, BAD REQUEST', 400, false));
        }
        if (!channelName) {
            return res.json(new responseObj('channel_name is not provided, BAD REQUEST', 400, false));
        }

        try {
            channelName = Encrypter.aesDecryption(key, channelName);
            userId = Encrypter.aesDecryption(key, userId);
        } catch (err) {
            console.log('decryption error', err);
            return res.json(new responseObj('Encryption Error', 400, false));
        }

        let channel = {
            channel_name: channelName
        }

        let channelInfo;

        try {
            let channelContent = await channelsService.findOrCreateChannel(channel);
            // console.log('this is channelContent', channelContent);
            if (channelContent[1]) {
                try {
                    let tempContent = await channelsService.findOrCreateChannel(group);
                    channelInfo = tempContent[0];
                } catch (err) {
                    console.log('this is error form joinGroup, channelsService inner', err);
                    return res.json('INTERNAL SERVER ERROR', 500, false);
                }
            } else {
                channelInfo = channelContent[0];
            }
        } catch (err) {
            console.log('this is error from joinGroup , channelsService', err);
            return res.json('INTERNAL SERVER ERROR', 500, false);
        }

        let channelUserContent;
        if (channelInfo) {
            let channeluser = {
                channel_id: channelInfo.channel_id,
                user_id: userId
            }
            try {
                channelUserContent = await channelUsersService.removeChannelUser(channeluser);
                console.log('this is groupUserContent', channelUserContent);
            } catch (err) {
                console.log('this is error from remove group user', err);
            }
        }
        if (channelUserContent) {
            return res.json(new responseObj('successfully leave group', 200, true));
        } else {
            return res.json(new responseObj('this user doesnt exist in this group', 400, false));
        }
    }


    async function joinChannel(req, res) {
        let channelName = req.body.channel_name;
        let userId = req.body.user_id;
        if (!userId) {
            return res.json(new responseObj('user_id not provided, BAD REQUEST', 400, false));
        }
        if (!channelName) {
            return res.json(new responseObj('channel_name is not provided, BAD REQUEST', 400, false));
        }
        try {
            channelName = Encrypter.aesDecryption(key, channelName);
            userId = Encrypter.aesDecryption(key, userId);
        } catch (err) {
            console.log('decryption error', err);
            return res.json(new responseObj('Encryption Error', 400, false));
        }
        let channel = {
            channel_name: channelName
        }
        let channelInfo;
        try {
            let channelContent = await channelsService.findOrCreateChannel(channel);
            // console.log('this is channelContent', groupContent);
            if (channelContent[1]) {
                try {
                    let tempContent = await channelsService.findOrCreateGroup(channel);
                    channelInfo = tempContent[0];
                } catch (err) {
                    console.log('this is error form joinChannel, channelsService inner', err);
                    return res.json('INTERNAL SERVER ERROR', 500, false);
                }
            } else {
                channelInfo = channelContent[0];
            }
        } catch (err) {
            console.log('this is error from joinChannel, channelsService', err);
            return res.json('INTERNAL SERVER ERROR', 500, false);
        }

        let channelUserInfo;
        if (channelInfo) {
            let channeluser = {
                channel_id: channelInfo.channel_id,
                user_id: userId
            }
            try {
                let channelUserContent = await channelUsersService.findOrCreateChannelUser(channeluser);
                // console.log('this is channelUserContent', channelUserContent);
                if (channelUserContent[1]) {
                    try {
                        let tempContent = await channelUsersService.findOrCreateChannelUser(channeluser);
                        channelUserInfo = tempContent[0];
                    } catch (err) {
                        console.log('this is error from joinGroup, channelUsersService inner', err);
                        return res.json(new responseObj('INTERNAL SERVER ERROR', 500, false));
                    }
                } else {
                    channelUserInfo = channelUserContent[0];
                }
            } catch (err) {
                if (err.name === "SequelizeForeignKeyConstraintError") {
                    return res.json(new responseObj('user does not exist', 400, false));
                } else {
                    console.log('this is error from joinGroup, channelUsersService', err);
                    return res.json(new responseObj('INTERNAL SERVER ERROR', 500, false));
                }
            }
        }
        if (channelUserInfo) {
            return res.json(new responseObj('user join successfully', 200, true, channelUserInfo))
        } else {
            return res.json(new responseObj('INTERNAL SERVER ERROR', 500, false));
        }
    }


    async function chatHistory(req, res) {
        console.log("Chat History");
        console.log('this is req userid', req.get('userid'));
        let userId = Encrypter.aesDecryption(process.env.ENCRYPT_KEY, req.get('userid'));
        console.log('this is the user', userId);

        let channelName = req.body.channel_name;

        if (!channelName) {
            return res.json(new responseObj('channel_name is not provided, BAD REQUEST', 400, false));
        }

    }


    return {
        createChannel,
        joinChannel,
        leaveChannel,
        chatHistory,
        aesEncryptor,
        aesDecryptor
    }
}

module.exports = ChatController;