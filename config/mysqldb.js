const development = {
    database: 'inr',
    user: 'root',
    password: 'root',
    host: 'localhost',
    charset: 'utf8mb4',
    timezone: 'utc',
    dataStrings: true
};

const testing = {
    database: 'inr',
    user: 'root',
    password: 'root',
    host: 'localhost',
    charset: 'utf8mb4',
    timezone: 'utc',
    dataStrings: true
};

const production = {
    database: process.env.PROD_DATABASE,
    user: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASS,
    host: process.env.PROD_DB_HOST,
    charset: process.env.PROD_DB_CHAR,
    timezone: 'utc',
    dataStrings: true
};


const mysql = require('mysql');
const path = require('path');

var database;

switch (process.env.NODE_ENV) {
    case 'production':
        database = mysql.createConnection(production);
        break;
    case 'testing':
        database = mysql.createConnection(testing);
        break;
    default:
        database = mysql.createConnection(development);
}

// console.log('this is ',database);
database.connect(function (err) {
    if (err) {
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection established');
});


module.exports = database;