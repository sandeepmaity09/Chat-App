const gcm = require('node-gcm');
const key = process.env.WEB_API_KEY_NOTIFICATION;
const sender = new gcm.Sender(key);

const userAuthService = require('../services/db/userAuth.service')();

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

module.exports = {
    sendMessageNotification
}