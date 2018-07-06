const gcm = require('node-gcm');
const _ = require('underscore');
const key = process.env.WEB_API_KEY_NOTIFICATION;
const sender = new gcm.Sender(key);

const userAuthService = require('../services/db/userAuth.service')();
const channelUsersService = require('../services/db/channelUsers.service')();
const userChannelStatusService = require('../services/db/userChannelStatus.service')();

async function sendMessageNotification(userId, payload) {
    let deviceTokenInfo;
    let message;
    let registrationTokens;
    try {
        let deviceTokenContent = await userAuthService.getUserAuth(userId);
        console.log("deviceTokencontent", deviceTokenContent);
        deviceTokenInfo = deviceTokenContent[0];
    } catch (err) {
        console.log("DeviceTokenContent Error", err);
    }

    let message = gcm.Message(payload);
    registrationTokens.push(deviceTokenInfo.device_token);

    sender.send(message, { registrationTokens: registrationTokens }, 10, function (err, response) {
        if (err) console.error(err);
        else console.log(response);
    });
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
                    console.log("channelUsersContent", channelUsersContent);
                    let channelUsersIdList = _.map(channelUsersContent, (item) => item.user_id);
                    console.log("channelUsersIdList", channelUsersIdList);
                    
                    channelUsersStatusContent = await userChannelStatusService.findUsersStatusByChannelIdAndListWithDevice(parseInt(channelId), channelUsersIdList);
                    console.log('this is channelUsersStatusContent', channelUsersStatusContent);
                    usersDeviceContent = await userAuthService.getUserAuthByUserList(channelUsersIdList);
                    console.log("this is usersDeviceContent", usersDeviceContent);
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


module.exports = {
    sendMessageNotification,
    getNoticiationAndroidUsers
}