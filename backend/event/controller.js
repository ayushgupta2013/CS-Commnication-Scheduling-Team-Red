const constants = require('../constants');
const { READ, JOIN, UPDATE, UPDATE_JOIN } = constants.permissions.event;

module.exports = function(usecase) {
  async function addEvent(req, res, next) {
    try {
      const userId = req.user.id;

      const event = {
        name: req.body.name,
        description: req.body.description,
        image: null,
        start: req.body.start,
        end: req.body.end,
        color: req.body.color,
        creatorId: userId,
        groupId: req.body.groupId
      };

      await usecase.addEvent(event);

      res.send({success: true});
    } 
    catch(err) {
      res.send({success: false, message: err.message});
    }   
  }

  async function editEvent(req, res, next) {
    try {
      const eventId = req.params.id; assert.ok(eventId);
      const userId = req.user.id;

      const event = {
        name: req.body.name,
        description: req.body.description,
        image: null,
        start: req.body.start,
        end: req.body.end,
        color: req.body.color,
      };

      await usecase.updateEvent({eventId, userId, event});

      res.send({success: true});

    }
    catch(err) {
      res.send({success: false, message: err.message});
    }
  }

  return {
    addEvent,
    editEvent
  };
}