const nodemailer = require('nodemailer');
const path = require('path');

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'webtestmobile@gmail.com', // generated ethereal user
        pass: 'Www!@#321' // generated ethereal password
    }
});


function callbackSend(error, info) {
    // return new Promise(function (resolve, reject) {
    if (error) {
        console.log("error", error)
        // reject(error);
    } else {
        console.log("info", info);
        // resolve({
        //     message: 'Success'
        // })
    }
    // })
}


exports.sendChatHistoryToEmail = function (mailto, filename) {
    let mailOptions = {
        from: process.env.MAIL_USER,
        to: mailto,
        subject: "Chat History",
        text: "Please find the below attachment for chathistory",
        attachments: [
            {
                filename: 'chathistory.pdf',
                path: path.join(__dirname + '../../../../uploads/reports/' + filename),
                contentType: 'application/pdf'
            }
        ]
    };
    return transporter.sendMail(mailOptions, this.callbackSend);
}
