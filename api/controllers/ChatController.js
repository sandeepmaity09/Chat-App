const _ = require('underscore');
const asnc = require('async');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const responseObj = require('../helpers/responseObj');
const Encrypter = require('../helpers/aesHelpers');

const channelsService = require('../services/db/channels.service')();
const channelUsersService = require('../services/db/channelUsers.service')();
const messagesService = require('../services/db/messages.service')();
const userStatusService = require('../services/db/userStatus.service')();
const unreadMessagesService = require('../services/db/unreadMessages.service')();

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
            // console.log()
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
                    channelInfo = Encrypter.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(channelInfo));
                } catch (err) {
                    console.log('this is error form createGroup, groupData inner', err);
                }
                return res.json(new responseObj('new channel successfully created', 200, true, channelInfo))
            } else {
                // return res.json(new responseObj('channel already exist', 400, false));
                try {
                    let tempContent = await channelsService.findOrCreateChannel(channel);
                    channelInfo = tempContent[0];
                    channelInfo = Encrypter.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(channelInfo));
                } catch (err) {
                    console.log('this is error form createGroup, groupData inner', err);
                }
                return res.json(new responseObj('channel already exist', 200, true, channelInfo))
            }
        } catch (err) {
            console.log('this is error from createGroup, groupData', err);
            return res.json(new responseObj('Internal Server Error', 500, false));
        }
    }

    async function leaveChannel(req, res) {
        let channelName = req.body.channel_name;
        let userId = req.body.user_id;
        // let userId = req.get('userid');

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
                // console.log('this is groupUserContent', channelUserContent);
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
        // let userId = req.get('userid');
        console.log('this is userId', userId);
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
            console.log('Decryption Error', err);
            return res.json(new responseObj('Decryption Error', 400, false));
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
                    let tempContent = await channelsService.findOrCreateChannel(channel);
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
            channelUserInfo = Encrypter.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(channelUserInfo));
            return res.json(new responseObj('user join successfully', 200, true, channelUserInfo))
        } else {
            return res.json(new responseObj('INTERNAL SERVER ERROR', 500, false));
        }
    }

    async function deleteChannel(req, res) {
        console.log("delete Called");
        let channelName = req.body.channel_name;

        if (!channelName) {
            return res.json(new responseObj('channel_name is not provided, BAD REQUEST', 400, false));
        }

        try {
            channelName = Encrypter.aesDecryption(key, channelName.toString());
        } catch (err) {
            console.log("Decryption Error", err);
        }

        let channel = {
            channel_name: channelName
        }
        let channelInfo;
        let updatedChannelInfo;
        try {
            // let deleteChannelContent = await channelsService.updateChannelById()
            let channelContent = await channelsService.findChannel(channel);
            console.log("channel Content", channelContent);
            channelInfo = channelContent;
        } catch (err) {
            console.log("Selection Error", err);
        }

        try {
            let deletedContent = await channelsService.updateChannelById(channelInfo.channel_id);
            console.log('deletedContent', deletedContent);
        } catch (err) {
            console.log("Deletation Error", err);
        }

        try {
            let channelContent = await channelsService.findChannel(channel);
            updatedChannelInfo = channelContent;
        } catch (err) {
            console.log("Selection Error", err);
        }


        if (updatedChannelInfo) {
            try {
                _.forEach(updatedChannelInfo, (value, key) => {
                    if (typeof updatedChannelInfo[key] === 'object') {
                        updatedChannelInfo[key] = Encrypter.aesEncryption(key, JSON.stringify(updatedChannelInfo[key]));
                    } else {
                        updatedChannelInfo[key] = Encrypter.aesEncryption(key, updatedChannelInfo[key].toString());
                    }
                })
            } catch (err) {
                console.log("Decryption Error", err);
            }
            return res.json(new responseObj("Succssfully Deleted Channel", 200, true, updatedChannelInfo));
        } else {
            return res.json(new responseObj("INTERNAL SERVER ERROR", 500, false));
        }
    }

    async function chatHistory(req, res) {
        console.log("Chat History");

        let channelName = req.body.channel_name;
        let userId = req.body.user_id;

        if (!userId) {
            return res.json(new responseObj('user_id not provided, BAD REQUEST', 400, false));
        }

        if (!channelName) {
            return res.json(new responseObj('channel_name is not provided, BAD REQUEST', 400, false));
        }

        // Decrypt the requested data
        // setTimeout(async function () {
        try {
            try {
                channelName = Encrypter.aesDecryption(key, channelName);
                userId = Encrypter.aesDecryption(key, userId);
            } catch (err) {
                console.log("Decryption Error", err);
                return res.json(new responseObj("Decryption Internal Error", 500, false));
            }


            // get the channel info
            let channelInfo;
            try {
                let channel = { channel_name: channelName };
                channelInfo = await channelsService.findChannel(channel);
                console.log("Channel Information", channelInfo);
            } catch (err) {
                console.log("Selection Error", err);
            }

            // get all channel users
            let channelUsersInfo;
            try {
                let channelUsersContent = await channelUsersService.findChannelUsers(parseInt(channelInfo.channel_id));
                console.log(channelUsersContent);
                channelUsersInfo = channelUsersContent;
            } catch (err) {
                console.log("Selection Error", err);
            }

            // fetch the unread message status

            let unreadMessageInfo;
            try {
                let unreadMessageContent = await unreadMessagesService.findUnreadMessageByUserIdChannelId(userId, parseInt(channelInfo.channel_id));
                console.log("unreadMessageContent", unreadMessageContent);
                unreadMessageInfo = unreadMessageContent;
            } catch (err) {
                console.log("Selection Error", err);
            }

            let unreadMessagesList;
            let readMessagesList;

            if (unreadMessageInfo) {
                // now get the list on behalf of "unread_messages" and "read_messages"

                // for unread messages 
                try {
                    let unreadMessageContent = await messagesService.getPaginatedUnreadMessagesByChannelIdMessageId(parseInt(channelInfo.channel_id), parseInt(unreadMessageInfo.message_id));
                    console.log("unreadMessageContent", unreadMessageContent);
                    unreadMessagesList = unreadMessageContent;
                } catch (err) {
                    console.log("Selection Error", err);
                }

                // for unread messages 
                try {
                    let readMessageContent = await messagesService.getPaginatedReadMessagesByChannelIdMessageId(parseInt(channelInfo.channel_id), parseInt(unreadMessageInfo.message_id));
                    console.log("readMessageContent", readMessageContent);
                    readMessagesList = readMessageContent;
                } catch (err) {
                    console.log("Selection Error", err);
                }

            } else {

                // new user fetch the complete list "unread_messages" = all and "read_messages" = 0;

                try {
                    unreadMessagesList = await messagesService.getMessagesByChannelId(parseInt(channelInfo.channel_id));
                    console.log("unreadMessagesList", unreadMessagesList);
                } catch (err) {
                    console.log("Selection Error", err);
                }
                readMessagesList = [];
            }

            try {
                _.forEach(unreadMessagesList, function (value, key) {
                    console.log('this is value', value);
                    delete unreadMessagesList[key].channel_id;
                    unreadMessagesList[key].channel_name = channelInfo.channel_name;
                })

                asnc.eachOf(unreadMessagesList, async function (value, key) {
                    if (parseInt(unreadMessagesList[key].parent_id)) {
                        let replyMessageContent;
                        try {
                            replyMessageContent = await messagesService.getMessageById(parseInt(unreadMessagesList[key].parent_id))
                            delete replyMessageContent.channel_id;
                            replyMessageContent.channel_name = channelInfo.channel_name;
                            unreadMessagesList[key].replyList = replyMessageContent;
                        } catch (err) {
                            console.log("Reply Selection Error", err);
                        }

                    } else {
                        unreadMessagesList[key].replyList = {};
                    }
                })

                _.forEach(readMessagesList, function (value, key) {
                    delete readMessagesList[key].channel_id;
                    readMessagesList[key].channel_name = channelInfo.channel_name;
                })

                asnc.eachOf(readMessagesList, async function (value, key) {
                    if (parseInt(readMessagesList[key].parent_id)) {
                        let replyMessageContent;
                        try {
                            replyMessageContent = await messagesService.getMessageById(parseInt(readMessagesList[key].parent_id))
                            delete replyMessageContent.channel_id;
                            replyMessageContent.channel_name = channelInfo.channel_name;
                            readMessagesList[key].replyList = replyMessageContent;
                        } catch (err) {
                            console.log("Reply Selection Error", err);
                        }

                    } else {
                        readMessagesList[key].replyList = {};
                    }
                })
                // console.log("After Computation", unreadMessagesList);
            } catch (err) {
                console.log("Computation Error", err);
            }

            let payload = {
                unreadMessages: unreadMessagesList,
                readMessages: readMessagesList
            }
            setTimeout(function () {
                console.log("final payload", payload)
                return res.json(new responseObj("Successfully Fetched Data", 200, true, Encrypter.aesEncryption(key, JSON.stringify(payload))));
            }, 4000);
        } catch (err) {
            return res.json(new responseObj("Internal Server Error", 500, false));
        }
        // },5000)
    }

    async function chatInsert(req, res) {
        console.log('chatInsert file', req.file);
        // console.log('chatInsert body', req.body);
        let messageInfo = req.body;
        try {
            _.forEach(messageInfo, (item, key) => {
                messageInfo[key] = Encrypter.aesDecryption(process.env.ENCRYPT_KEY, messageInfo[key]);
            })
        } catch (err) {
            console.log('Encryption Error', err);
        }

        let channelInfo
        try {
            let channelContent = await channelsService.findChannel({ channel_name: messageInfo.channel_name });
            channelInfo = channelContent;
        } catch (err) {
            console.log("Channel Fetching Error", err);
        }
        console.log(messageInfo);


        if (parseInt(messageInfo.message_type) === 3) {
            let filename = req.file.filename;
            let filePrefix = filename.split('.')[0];
            console.log('filename prefix', filePrefix);
            try {
                let tempLog = await ffmpeg(path.join(__dirname + '../../../uploads/videos/' + filename))
                    .screenshots({
                        count: 1,
                        timemarks: ['1'],
                        filename: filePrefix + '.jpg',
                        folder: path.join(__dirname + '../../../uploads/thumbs'),
                        size: '200x200'
                    })
                // console.log('this is tempLog', tempLog);
            } catch (err) {
                console.log("ffmpeg Error", err);
            }
        }
        let insertedMessageId;
        let insertedMessageInfo;
        try {
            let message = {
                user_id: parseInt(messageInfo.user_id),
                channel_id: parseInt(channelInfo.channel_id),
                chat_type: parseInt(messageInfo.chat_type),
                message_type: parseInt(messageInfo.message_type),
                message: messageInfo.message,
                parent_id: parseInt(messageInfo.parent_id),
                filelink: req.file.filename,
                thumbnail: ((parseInt(messageInfo.message_type) === 3) ? req.file.filename.split('.')[0].toString() + ".jpg" : ""),
                is_flagged: 0,
                message_status: 0,
                created_at: messageInfo.created_at,
                updated_at: messageInfo.created_at
            }
            let messageContent = await messagesService.saveMessage(message);
            // console.log('this is messageContent', messageContent);
            if (messageContent) {
                insertedMessageId = messageContent.dataValues.message_id;
                try {
                    let tempContent = await messagesService.getMessageById(insertedMessageId);
                    insertedMessageInfo = tempContent
                } catch (err) {
                    console.log("Database Error", err);
                }
            }
        } catch (err) {
            console.log("Insertation Error", err);
        }

        if (insertedMessageInfo) {
            insertedMessageInfo.message_timestamp = messageInfo.message_timestamp;
            _.forEach(insertedMessageInfo, (item, key) => {
                if (item != null) {
                    insertedMessageInfo[key] = Encrypter.aesEncryption(process.env.ENCRYPT_KEY, insertedMessageInfo[key].toString());
                } else {
                    delete insertedMessageInfo[key];
                }
            })
            // insertedMessageInfo = Encrypter.aesEncryption(process.env.ENCRYPT_KEY, JSON.stringify(insertedMessageInfo));
            return res.json(new responseObj('message successfully inserted', 200, true, insertedMessageInfo));
        } else {
            return res.json(new responseObj('Internal Server Error', 500, false));
        }
        // console.log('this is insertedMessageConent', insertedMessageInfo);
    }

    async function readChatHistory(req, res) {
        console.log("Read Chat History");

        let channelName = req.body.channel_name;
        let userId = req.body.user_id;
        let messageId = req.body.message_id;

        if (!userId) {
            return res.json(new responseObj('user_id not provided, BAD REQUEST', 400, false));
        }

        if (!channelName) {
            return res.json(new responseObj('channel_name is not provided, BAD REQUEST', 400, false));
        }

        if (!messageId) {
            return res.json(new responseObj('message_id not provided, BAD REQUEST', 400, false));
        }

        try {

            try {
                channelName = Encrypter.aesDecryption(key, channelName);
                userId = Encrypter.aesDecryption(key, userId);
                messageId = Encrypter.aesDecryption(key, messageId);
            } catch (err) {
                console.log("Decryption Error", err);
            }

            // get the channel info
            let channelInfo;
            try {
                let channel = { channel_name: channelName };
                channelInfo = await channelsService.findChannel(channel);
                console.log("Channel Information", channelInfo);
            } catch (err) {
                console.log("Selection Error", err);
            }

            // get all channel users
            let channelUsersInfo;
            try {
                let channelUsersContent = await channelUsersService.findChannelUsers(parseInt(channelInfo.channel_id));
                console.log(channelUsersContent);
                channelUsersInfo = channelUsersContent;
            } catch (err) {
                console.log("Selection Error", err);
            }

            let readMessagesList;
            try {
                let readMessagesContent = await messagesService.getPaginatedReadMessagesWithoutSameByChannelIdMessageId(parseInt(channelInfo.channel_id), parseInt(messageId));
                readMessagesList = readMessagesContent;
            } catch (err) {
                console.log("Selection Error", err);
            }

            try {
                _.forEach(readMessagesList, function (value, key) {
                    delete readMessagesList[key].channel_id;
                    readMessagesList[key].channel_name = channelInfo.channel_name;
                })

                asnc.eachOf(readMessagesList, async function (value, key) {
                    if (parseInt(readMessagesList[key].parent_id)) {
                        let replyMessageContent;
                        try {
                            replyMessageContent = await messagesService.getMessageById(parseInt(readMessagesList[key].parent_id))
                            delete replyMessageContent.channel_id;
                            replyMessageContent.channel_name = channelInfo.channel_name;
                            readMessagesList[key].replyList = replyMessageContent;
                        } catch (err) {
                            console.log("Reply Selection Error", err);
                        }

                    } else {
                        readMessagesList[key].replyList = {};
                    }
                })
            } catch (err) {
                console.log("Computation Error", err);
            }

            let payload = {
                readMessages: readMessagesList
            }
            payload = Encrypter.aesEncryption(key, JSON.stringify(payload));
            return res.json(new responseObj("Successfully Fetched Data", 200, true, payload));
        } catch (err) {
            return res.json(new responseObj("Internal Server Error", 500, false));
        }
    }

    async function setUserStatus(req, res) {

        let userId = req.body.user_id;
        let userStatus = req.body.user_status;

        if (!userId) {
            return res.json(new responseObj('user_id not provided, BAD REQUEST', 400, false));
        }

        if (!userStatus) {
            return res.json(new responseObj('user_status not provided, BAD REQUEST', 400, false));
        }

        try {
            userId = Encrypter.aesDecryption(process.env.ENCRYPT_KEY, req.body.user_id);
            userStatus = Encrypter.aesDecryption(process.env.ENCRYPT_KEY, req.body.user_status);
        } catch (err) {
            console.log("Decryption Error", err);
            return res.json(new responseObj("Decryption Internal Error", 500, false));
        }

        try {
            let selectedMessageContent = await userStatusService.findUserStatusByUserId(userId);
            console.log('this is insertedMessageContent', selectedMessageContent);
            if (selectedMessageContent.length) {
                // already exist
                try {
                    let updateUserStatusContent = await userStatusService.updateUserStatus(userId, userStatus);
                    console.log(updateUserStatusContent);
                    // if (updateUserStatusContent) {
                    return res.json(new responseObj("Successfully Updated", 200, true));
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
                        return res.json(new responseObj("Successfully Updated", 200, true));
                    }
                } catch (err) {
                    console.log("Insertation Error", err);
                }
            }
        } catch (err) {
            return res.json(new responseObj("Internal Server Error", 500, false));
            console.log("Insertation Error", err);
        }
    }


    return {
        createChannel,
        joinChannel,
        leaveChannel,
        deleteChannel,
        chatHistory,
        chatInsert,
        aesEncryptor,
        aesDecryptor,
        setUserStatus,
        readChatHistory
    }
}

module.exports = ChatController;