const _ = require('underscore');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const Encryptor = require('../helpers/aesHelpers');

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        // console.log('this is body', req.body);
        // console.log('this is file', req.file);
        let type = req.body.message_type;
        type = parseInt(Encryptor.aesDecryption(process.env.ENCRYPT_KEY, type));
        if (type === 1) {
            callback(null, path.join(__dirname + "../../../uploads/images"));
        } else if (type === 2) {
            callback(null, path.join(__dirname + "../../../uploads/audios"));
        } else if (type === 3) {
            callback(null, path.join(__dirname + "../../../uploads/videos"));
        } else if (type === 4) {
            callback(null, path.join(__dirname + "../../../uploads/docs"));
        }
    },
    filename: function (req, file, callback) {
        callback(null, uuidv4() + path.extname(file.originalname))
    },
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        // console.log('this is file', file);
        let ext = path.extname(file.originalname);
        if (ext === '.png' || ext === '.jpg' || ext === '.gif' || ext === '.jpeg' || ext === '.PNG' || ext === '.JPG' || ext === '.GIF' || ext === '.JPEG') {
            callback(null, true);
        } else if (ext === '.mp3' || ext === '.mp4' || ext === '.MP4' || ext === '.MP3' || ext === '.3GA' || ext === '.WAV' || ext === '.wav' || ext === '.AIF' || ext === '.aif' || ext === '.MID' || ext === '.mid') {
            callback(null, true);
        } else if (ext === '.mng' || ext === '.avi' || ext === '.mov' || ext === '.wmv' || ext === '.MP4' || ext === '.3GP' || ext === '.3GP2' || ext === '.AJP' || ext === '.mp4' || ext === '.3gp') {
            callback(null, true);
        } else if (ext === '.xlsx' || ext === '.pdf' || ext === '.docx') {
            callback(null, true);
        } else {
            callback(null, false);
        }
    }
})

module.exports = {
    upload
}