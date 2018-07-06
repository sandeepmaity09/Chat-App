const path = require('path');

const MSG_TYPE_TEXT = 0;
const MSG_TYPE_IMAGE = 1;
const MSG_TYPE_AUDIO = 2;
const MSG_TYPE_VIDEO = 3;
const MSG_TYPE_DOCS = 4;

const MSG_SOURCE_IMAGE = path.join(__dirname + '../../../uploads/images/');
const MSG_SOURCE_AUDIO = path.join(__dirname + '../../../uploads/audios/');
const MSG_SOURCE_VIDEO = path.join(__dirname + '../../../uploads/videos/');
const MSG_SOURCE_DOCS = path.join(__dirname + '../../../uploads/docs/');
const MSG_SOURCE_THUMBS = path.join(__dirname + '../../../uploads/thumbs/');

// console.log("this is MSG_SOURCE", MSG_SOURCE);

module.exports = {
    MSG_TYPE_TEXT,
    MSG_TYPE_IMAGE,
    MSG_TYPE_VIDEO,
    MSG_TYPE_AUDIO,
    MSG_TYPE_DOCS,
    MSG_SOURCE_IMAGE,
    MSG_SOURCE_AUDIO,
    MSG_SOURCE_VIDEO,
    MSG_SOURCE_DOCS,
    MSG_SOURCE_THUMBS
}