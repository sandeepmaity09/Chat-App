const gcm = require('node-gcm');
const _ = require('underscore');
const axios = require('axios');

const key = process.env.ANDROID_GCM_KEY;
const sender = new gcm.Sender(key);

const userAuthService = require('../services/db/userAuth.service')();
const channelUsersService = require('../services/db/channelUsers.service')();
const userChannelStatusService = require('../services/db/userChannelStatus.service')();

const sequelize = require('../../config/database');

// async function sendMessageNotification(userId, payload) {
//     let deviceTokenInfo;
//     let message;
//     let registrationTokens;
//     try {
//         let deviceTokenContent = await userAuthService.getUserAuth(userId);
//         console.log("deviceTokencontent", deviceTokenContent);
//         deviceTokenInfo = deviceTokenContent[0];
//     } catch (err) {
//         console.log("DeviceTokenContent Error", err);
//     }

//     let message = gcm.Message(payload);
//     registrationTokens.push(deviceTokenInfo.device_token);

//     sender.send(message, { registrationTokens: registrationTokens }, 10, function (err, response) {
//         if (err) console.error(err);
//         else console.log(response);
//     });
// }

async function sendAndroidNotification(payload, token) {
    // console.log("this is payloadn and token", payload, token);
    let message = new gcm.Message({
        data: payload,
        priority: 'high'
    })
    let regTokens = [];

    if (typeof token === "string") {
        // console.log("true");
        // console.log("this is token", token);
        regTokens.push(token);
    } else {
        // console.log("false");
        regTokens = token;
    }
    console.log(message, regTokens);
    sender.send(message, { registrationTokens: regTokens }, function (err, response) {
        if (err)
            console.log(err);
        else
            console.log(response);
    })
}

async function getNoticiationAndroidUsers(channelId) {
    console.log("this is getNotificationAndroidUsers");
    console.log("this is channel Id", channelId);
    let onlineUsersList = [];
    try {
        try {
            let channelUsersStatusContent;
            let usersDeviceContent;
            try {
                // find all users in this channel and then check for each user's status
                try {
                    let channelUsersContent = await channelUsersService.findChannelUsersOnly(parseInt(channelId));
                    // console.log("channelUsersContent", channelUsersContent);
                    let channelUsersIdList = _.map(channelUsersContent, (item) => item.user_id);
                    // console.log("channelUsersIdList", channelUsersIdList);

                    channelUsersStatusContent = await userChannelStatusService.findUsersStatusByChannelIdAndListWithDevice(parseInt(channelId), channelUsersIdList);
                    // console.log('this is channelUsersStatusContent', channelUsersStatusContent);
                    usersDeviceContent = await userAuthService.getUserAuthByUserList(channelUsersIdList);
                    // console.log("this is usersDeviceContent", usersDeviceContent);
                } catch (err) {
                    console.log("Selection Error", err);
                }
            } catch (err) {
                console.log("Database Error", err);
            }

            console.log("this is channelUsersStatusContent", channelUsersStatusContent);
            _.forEach(channelUsersStatusContent, (value1, key1) => {
                _.forEach(usersDeviceContent, (value2, key2) => {
                    // if (parseInt(channelUsersStatusContent[key1].user_channel_status)) {
                    //     if (parseInt(usersDeviceContent[key2].device_type) === 2) {
                    //         onlineUsersList.push(channelUsersStatusContent[key].user_id);
                    //     }
                    // }

                    // if () {

                    // }
                })
            })
        } catch (err) {
            console.log("Selection Error", err);
        }
        return onlineUsersList;
    } catch (err) {
        console.log("Error", err);
        return [];
    }

}

async function sendAndroidNotificationWhenUserOffline(channelInfo, message, senderId) {

    // console.log("this is sendAndroidNotificationWhenUserOffline", channelId);
    // console.log("this is for message", message);
    message = JSON.parse(message);
    channelInfo = JSON.parse(channelInfo);
    senderId = parseInt(senderId);
    let channelUsersList;
    try {
        channelUsersList = await sequelize.query(`SELECT user_id FROM chat_user_channel_status WHERE channel_id = ${parseInt(channelInfo.channel_id)} AND user_channel_status = 0`, { type: sequelize.QueryTypes.SELECT });
        senderName = await sequelize.query(`SELECT user_name from users WHERE user_id = ${senderId}`, { type: sequelize.QueryTypes.SELECT });
        teamDetails = await sequelize.query(`SELECT team_id,team_name FROM teams where team_id = ${parseInt(channelInfo.channel_name)}`, { type: sequelize.QueryTypes.SELECT })
        // console.log("team details", teamDetails);
        // console.log("ChannelUsersContent", channelUsersList);
        // console.log("sender Name ", senderName[0]);
        let channelUsersIdList = _.map(channelUsersList, (item) => item.user_id);
        userDeviceContent = await userAuthService.getUserAuthByUserList(channelUsersIdList);
        // console.log("Token Details", userDeviceContent);

        let payload = {
            "title": "INR",
            "push_type": "Message",
            "sender_id": senderId,
            "team_id": teamDetails[0].team_id,
            "team_name": teamDetails[0].team_name,
            "sender_name": senderName[0].user_name,
            "message": JSON.stringify(message)
        }
        // console.log()
        _.forEach(userDeviceContent, (value, key) => {
            // console.log("this is value and key", value, key);
            payload['receiver_id'] = value.user_id;
            sendAndroidNotification(payload, value.push_token);
        })
    } catch (err) {
        console.log("ChannelUsersContent Error", err);
    }
}


module.exports = {
    getNoticiationAndroidUsers,
    sendAndroidNotification,
    sendAndroidNotificationWhenUserOffline
}