const Channel = require('../../models/Channel');

const ChannelsService = () => {


    const createChannel = (group) => {
        return Channel.create(group, { raw: true });
    }

    const findOrCreateChannel = (group) => {
        return Channel.findOrCreate({ where: { channel_name: group.channel_name, }, raw: true })
    }


    return {
        createChannel,
        findOrCreateChannel
    }
}

module.exports = ChannelsService;