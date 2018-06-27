const Channel = require('../../models/Channel');
const sequlize = require('../../../config/database');
const getUTCDate = require('../../helpers/dateHelpers');


const ChannelsService = () => {


    const createChannel = (group) => {
        return Channel.create(group, { raw: true });
    }

    const findOrCreateChannel = (group) => {
        return Channel.findOrCreate({ where: { channel_name: group.channel_name, }, raw: true })
    }

    const findChannel = (channel) => {
        return Channel.find({ where: { channel_name: channel.channel_name }, raw: true });
    }

    const findChannelById = (id) => {
        return Channel.find({ where: { channel_id: id }, raw: true })
    }

    const updateChannelById = (id) => {
        return sequlize.query(`UPDATE chat_channels SET channel_status = 0, updated_at = "${getUTCDate()}" WHERE channel_id = ${parseInt(id)}`, { type: sequlize.QueryTypes.UPDATE });
    }


    return {
        createChannel,
        findOrCreateChannel,
        findChannel,
        findChannelById,
        updateChannelById
    }
}

module.exports = ChannelsService;