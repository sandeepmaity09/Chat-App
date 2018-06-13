const responseObj = require('../../api/helpers/responseObj');

const jsonErrorHandler = function (error, req, res, next) {
    if (error instanceof SyntaxError && 'body' in error) {
        res.json(responseObj('Error in json data provided', 400, false))
    } else {
        res.json(responseObj(error.message, 400, false));
    }
    next(error);
}


module.exports = {
    jsonErrorHandler
}