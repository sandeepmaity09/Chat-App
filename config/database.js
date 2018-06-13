const Sequelize = require('sequelize', );
const path = require('path');

const connection = require('./connection');

let database;

switch (process.env.NODE_ENV) {
  case 'production':
    database = new Sequelize(
      connection.production.database,
      connection.production.username,
      connection.production.password,
      {
        host: connection.production.host,
        dialect: connection.production.dialect,
        pool: {
          max: 5,
          min: 0,
          idle: 10000,
        },
        dialectOptions: {
          useUTC: false, //for reading from database
          dateStrings: true,

          typeCast: function (field, next) { // for reading from database
            if (field.type === 'TIMESTAMP') {
              return field.string()
            }
            return next()
          },
        },
        // timezone: "+05:30"
      });
    break;
  case 'testing':
    database = new Sequelize(
      connection.testing.database,
      connection.testing.username,
      connection.testing.password, {
        host: connection.testing.host,
        dialect: connection.testing.dialect,
        pool: {
          max: 5,
          min: 0,
          idle: 10000,
        },
        dialectOptions: {
          useUTC: false, //for reading from database
          dateStrings: true,

          typeCast: function (field, next) { // for reading from database
            if (field.type === 'TIMESTAMP') {
              return field.string()
            }
            return next()
          },
        },
        // timezone: "+05:30"
      });
    break;
  default:
    database = new Sequelize(
      connection.development.database,
      connection.development.username,
      connection.development.password, {
        host: connection.development.host,
        dialect: connection.development.dialect,
        pool: {
          max: 5,
          min: 0,
          idle: 10000,
        },
        dialectOptions: {
          useUTC: false, //for reading from database
          dateStrings: true,

          typeCast: function (field, next) { // for reading from database
            if (field.type === 'TIMESTAMP') {
              return field.string()
            }
            return next()
          },
        },
        // timezone: "+05:30"
      });
}

module.exports = database;
