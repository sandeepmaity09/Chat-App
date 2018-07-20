const crypto = require('crypto');

let algorithm = 'aes-128-cbc';
// let key = 'c1b232e5058928c7';
// let key = '0123456789abcdef';
// let Base64 = { _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function (e) { var t = ""; var n, r, i, s, o, u, a; var f = 0; e = Base64._utf8_encode(e); while (f < e.length) { n = e.charCodeAt(f++); r = e.charCodeAt(f++); i = e.charCodeAt(f++); s = n >> 2; o = (n & 3) << 4 | r >> 4; u = (r & 15) << 2 | i >> 6; a = i & 63; if (isNaN(r)) { u = a = 64 } else if (isNaN(i)) { a = 64 } t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a) } return t }, decode: function (e) { var t = ""; var n, r, i; var s, o, u, a; var f = 0; e = e.replace(/[^A-Za-z0-9+/=]/g, ""); while (f < e.length) { s = this._keyStr.indexOf(e.charAt(f++)); o = this._keyStr.indexOf(e.charAt(f++)); u = this._keyStr.indexOf(e.charAt(f++)); a = this._keyStr.indexOf(e.charAt(f++)); n = s << 2 | o >> 4; r = (o & 15) << 4 | u >> 2; i = (u & 3) << 6 | a; t = t + String.fromCharCode(n); if (u != 64) { t = t + String.fromCharCode(r) } if (a != 64) { t = t + String.fromCharCode(i) } } t = Base64._utf8_decode(t); return t }, _utf8_encode: function (e) { e = e.replace(/rn/g, "n"); var t = ""; for (var n = 0; n < e.length; n++) { var r = e.charCodeAt(n); if (r < 128) { t += String.fromCharCode(r) } else if (r > 127 && r < 2048) { t += String.fromCharCode(r >> 6 | 192); t += String.fromCharCode(r & 63 | 128) } else { t += String.fromCharCode(r >> 12 | 224); t += String.fromCharCode(r >> 6 & 63 | 128); t += String.fromCharCode(r & 63 | 128) } } return t }, _utf8_decode: function (e) { var t = ""; var n = 0; var r = c1 = c2 = 0; while (n < e.length) { r = e.charCodeAt(n); if (r < 128) { t += String.fromCharCode(r); n++ } else if (r > 191 && r < 224) { c2 = e.charCodeAt(n + 1); t += String.fromCharCode((r & 31) << 6 | c2 & 63); n += 2 } else { c2 = e.charCodeAt(n + 1); c3 = e.charCodeAt(n + 2); t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63); n += 3 } } return t } }

const fixString = function (data) {
    if (data.length < 16) {
        return data.padEnd(16, "0");
    }
    if (data.length > 16) {
        return data.substring(0, 16);
    }
    return data;
}

// const aesEncryption = function (data) {
//     let key = 'c1b232e5058928c7';
//     // key = fixString(key);
//     let iv = '0000000000000000';
//     let cipher = crypto.createCipheriv(algorithm, key, iv);
//     let crypted = cipher.update(data, 'utf8', 'binary');
//     let cbase64 = new Buffer(crypted, 'binary').toString('base64');
//     crypted += cipher.final('binary');
//     // let encodedIV = Base64.encode(iv);
//     let encodedIV = Buffer.from(iv).toString('base64');
//     console.log('crypted and encodedIV', crypted, encodedIV);
//     let payload = crypted + ":" + encodedIV;
//     return payload;
// }




// const encrypt = function (data) {
//     let iv = '0000000000000000';
//     console.log('this is key algo and iv', key, algorithm, iv);

//     let cipher = crypto.createCipheriv(algorithm, key, iv);
//     let crypted = cipher.update(data, 'utf8', 'binary');
//     let cbase64 = new Buffer(crypted, 'binary').toString('base64');
//     cipher.setAutoPadding(0);
//     // console.log(crypted);
//     // console.log(cbase64);

//     crypted += cipher.final('binary');
//     crypted = new Buffer(crypted, 'binary').toString('base64');
//     // let iv6 = Buffer.from(iv, 'binary').toString('base64');
//     let iv6 = iv.toString('base64').slice(0, 16);
//     console.log(crypted);
//     console.log(iv6);
//     let payload = crypted + ":" + iv6;
//     console.log(payload);
//     return payload;
// }

// const aesDecryption = function (data) {
//     let key = 'c1b232e5058928c7';
//     let temp = data.split(":");
//     let encrypted = temp[0];
//     encrypted = Buffer.from(encrypted, 'base64').toString('binary');
//     let iv = temp[1];
//     iv = Buffer.from(iv).toString('utf8');
//     let decipher = crypto.createDecipheriv(algorithm, key, iv);
//     let decoded = decipher.update(encrypted, 'binary', 'utf8');
//     decoded += decipher.final('utf8');
//     console.log(decoded);
//     return decoded;
// }


// const decrypt = function (crypted) {
//     console.log(crypted);
//     let temp = crypted.split(':');
//     let encrypted = temp[0];
//     let ivv = temp[1];
//     console.log(encrypted);
//     console.log(ivv);
//     // let iv = Buffer(ivv, 'base64').toString('binary');
//     let iv = ivv.toString('hex').slice(0, 16);
//     console.log(iv);
//     encrypted = new Buffer(encrypted, 'base64').toString('ascii');
//     let deciper = crypto.createDecipheriv(algorithm, key, iv);
//     deciper.setAutoPadding(0);
//     let decoded = deciper.update(encrypted, 'binary', 'utf8');
//     decoded += deciper.final('utf8');

//     console.log(decoded);
//     console.log(iv);
//     return decoded;
// }



// const decrypt = function (crypted) {
//     crypted = new Buffer(crypted, 'base64').toString('binary');
//     let deciper = crypto.createDecipheriv(algorithm, key, iv);
//     let decoded = deciper.update(crypted, 'binary', 'utf8');
//     decoded += deciper.final('utf8');
//     return decoded;
// }





const aesEncryption = function (key, data) {
    let iv = crypto.pseudoRandomBytes(16);
    key = fixString(key);
    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let crypted = cipher.update(data, 'utf8', 'base64');
    crypted += cipher.final('base64');
    let encodedIV = new Buffer(iv).toString('base64');
    // console.log('this is endodedIV', encodedIV);
    let payload = crypted + ":" + encodedIV;
    console.log("data after encoding", payload);
    // payload = payload.replace(new RegExp('+', 'g'), '.');
    payload = payload.split('+').join('.');
    payload = payload.split('/').join('_');
    payload = payload.split('=').join('-');
    // payload = payload.replace(/'\/'/g, '_');
    // payload = payload.replace(/'='/g, '-');
    console.log("data after replacing", payload);
    return payload;
}


const aesDecryption = function (key, data) {
    key = fixString(key);
    console.log("data getting", data);
    // data = data.replace(/./g, '+');
    // data = data.replace(/_/g, '/');
    // data = data.replace(/-/g, '=');
    data = data.split('.').join('+');
    data = data.split('_').join('/');
    data = data.split('-').join('=');
    console.log("data after replacing", data);
    let temp = data.split(':');
    let encodedIV = temp[1];
    let encodedData = temp[0];
    let decodedIV = Buffer.from(encodedIV, 'base64');
    // console.log('this is decoded IV', decodedIV);

    let deciper = crypto.createDecipheriv(algorithm, key, decodedIV);
    let decrypted = deciper.update(encodedData, 'base64', 'utf8');
    decrypted += deciper.final('utf8');
    // decrypted = decrypted.replace(/\r?\n|\r|\\|\"/g, " ");
    // console.log('this is decoded data', decrypted);
    return decrypted;
}

module.exports = {
    aesEncryption,
    aesDecryption
}