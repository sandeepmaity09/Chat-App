const Users = require('../../models/Users');
const sequlize = require('../../../config/database');
const getUTCDate = require('../../helpers/dateHelpers');


const UsersService = () => {


    const getUserByUserId = (userId) => {
        return Users.find({ attributes: ['user_id', 'user_name', 'email'], where: { user_id: userId }, raw: true })
    }

    return {
        getUserByUserId
    }
}

module.exports = UsersService;