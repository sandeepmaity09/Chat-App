const Channel = require('../../models/Channel');

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


    return {
        createChannel,
        findOrCreateChannel,
        findChannel
    }
}

module.exports = ChannelsService;