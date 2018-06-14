const Group = require('../../models/Group');

const GroupsService = () => {


    const createGroup = (group) => {
        return Group.create(group);
    }


    return {
        createGroup
    }
}

module.exports = GroupsService;