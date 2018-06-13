const responseObj = function (message, status, success, data) {
    if (data) {
        this.data = undefined;
    } else {
        this.data = data;
    }
    this.message = message;
    this.status = status;
    this.success = success;
    return { message, status, success, data }
}

module.exports = responseObj;