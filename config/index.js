const chatRoutes = require('./routes/chatRoutes');
const jsonErrorHandler = require('./handlers/errorHandlers').jsonErrorHandler;

module.exports = {
  keep: false,
  chatRoutes,
  port: process.env.PORT || '2017',
  jsonErrorHandler: jsonErrorHandler,
};
