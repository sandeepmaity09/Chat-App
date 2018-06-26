const getUTCDate = function () {
    let d = new Date();
    let day = d.getUTCDate();
    let month = d.getUTCMonth() + 1;
    let year = d.getUTCFullYear();
    if (day < 10) {
        day = "0" + day;
    }
    if (month < 10) {
        month = "0" + month;
    }
    let curr_hour = d.getUTCHours();
    let curr_min = d.getUTCMinutes();
    let curr_sec = d.getUTCSeconds();
    let date = year + "-" + month + "-" + day + " " + curr_hour + ":" + curr_min + ":" + curr_sec;
    return date;
}

module.exports = getUTCDate;