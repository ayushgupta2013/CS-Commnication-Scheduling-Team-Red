const moment = require('moment-timezone'); moment.tz.setDefault('utc');
const assert = require('assert');
const AppointmentEventResourceAggregator = require('./collector_appointment_event');
const AppointmentResourceAggregator = require('./collector_appointment');
const constants = require('../constants');
const { READ, JOIN, UPDATE, UPDATE_JOIN } = constants.permissions.appointmentEvent;

module.exports = function(repository, {resourceUsecase}) {
  assert.ok(resourceUsecase);

  //TODO: sql transaction for series of inserts
  async function addAppointmentEvent({start, slotCount, slotInterval, description, appointerId, name, color, groupId}) {
    assert.ok(start); assert.ok(slotCount); assert.ok(slotInterval); assert.ok(appointerId); assert.ok(color); assert.ok(groupId);
    assert.ok(Number.isInteger(slotInterval) && slotInterval > 0);
    assert.ok(Number.isInteger(slotCount) && slotCount > 0);
    name = name || null;

    const duration = slotCount * slotInterval;
    start = moment(start); const end = start.clone().add(duration, 'minutes');
    setSecondsToZero(start); setSecondsToZero(end);

    const user = await repository.findUserById(appointerId);
    assert.ok(user); assert.ok(user.userType === constants.USERTYPE_FACULTY);

    const appointmentEventId = await repository.addAppointmentEvent({start, end, slotInterval, description, appointerId, slotCount, name, color, groupId});

    const resourceId = await repository.addAppointmentEventResource(appointmentEventId);

    //give join permission to the group
    await resourceUsecase.addResourcePermissionToUserGroup({groupId, resourceId, permission: JOIN});

    //give update permission to creator
    const soloGroup = await repository.getSoloGroupOfUser(appointerId);
    await resourceUsecase.addResourcePermissionToUserGroup({groupId: soloGroup.id, resourceId, permission: UPDATE});

    return appointmentEventId;
  }

  /*
    @return Promise<Array<{
      appointmentEventId: int, 
      permission: 'UPDATE+JOIN' || 'READ' || 'UPDATE' || 'JOIN', 
      resourceId: int}>>
  */
  async function getAllVisibleAppointmentEventResourcesOfUser(userId) {
    assert.ok(userId);
    const collector = new AppointmentEventResourceAggregator();
    const fetcher = {fetch: repository.getAppointmentEventResourcesOfGroups};

    await resourceUsecase.getAccessibleResources(userId, collector, fetcher);
    return collector.getCollection();
  }

  async function getAllVisibleAppointmentEventsOfUser(userId) {
    assert.ok(userId);

    const resources = await getAllVisibleAppointmentEventResourcesOfUser(userId);
    const appointmentEventIds = resources.map(r => r.appointmentEventId);
    const appointmentEvents = await repository.getAppointmentEvents(appointmentEventIds);

    return appointmentEvents.map(ape => {
      const permission = resources.find(r => r.appointmentEventId === ape.id).permission;
      ape.permission = permission; return ape;
    });
  }

  /*
    @return Promise<Array<{
      appointmentId: int, 
      permission: 'READ' || 'UPDATE', 
      resourceId: int}>>
  */
  async function getAllVisibleAppointmentResourcesOfUser(userId) {
    assert.ok(userId);
    const collector = new AppointmentResourceAggregator();
    const fetcher = {fetch: repository.getAppointmentResourcesOfGroups};

    await resourceUsecase.getAccessibleResources(userId, collector, fetcher);
    return collector.getCollection();
  }

  async function getAllJoinableAppointmentEventsOfUser(userId) {
    let resources = await getAllVisibleAppointmentEventResourcesOfUser(userId);
    resources  = resources.filter(r => r.permission === JOIN
      || r.permission === UPDATE_JOIN);

    const apIds = resources.map(r => r.appointmentEventId);
    const appointmentEvents = await repository.getAppointmentEvents(apIds);

    return appointmentEvents;
  }

  async function hasAppointmentPermission({appointmentId, userId, permission}) {
    assert.ok(appointmentId); assert.ok(userId);
    assert.ok([READ, UPDATE].indexOf(permission) >= 0);

    const collector = new AppointmentResourceAggregator();
    const fetcher = {fetch: repository.getAppointmentResourcesOfGroups};

    await resourceUsecase.getAccessibleResources(userId, collector, fetcher);
    return collector.hasPermission(appointmentId, permission);
  }
  
  async function hasAppointmentEventPermission({appointmentEventId, userId, permission}) {
    assert.ok(appointmentEventId); assert.ok(userId);
    assert.ok([READ, UPDATE].indexOf(permission) >= 0);

    const collector = new AppointmentEventResourceAggregator();
    const fetcher = {fetch: repository.getAppointmentEventResourcesOfGroups};

    await resourceUsecase.getAccessibleResources(userId, collector, fetcher);
    return collector.hasPermission(appointmentEventId, permission);
  }

  async function getAppointmentEventsOfAppointer(appointerId) {
    assert.ok(appointerId);
    const appointer = await getUser(appointerId); assert.ok(appointer);

    assert.ok(appointer.userType === constants.USERTYPE_FACULTY);
  
    return repository.getAppointmentEventsofAppointer(appointerId);
  }

  //TODO: position should be unique for a given appointmentEventId
  //TODO: check if user has JOIN permission on appointmentEvent
  async function addAppointment({position, appointmentEventId, appointeeId}) {
    assert.ok(Number.isInteger(position) && position >= 0);
    assert.ok(appointeeId); assert.ok(appointmentEventId);

    const ae = await repository.getAppointmentEvent(appointmentEventId);
    assert.ok(ae); assert.ok(position < ae.slotCount);

    const startOffset = ae.slotInterval * position;
    const endOffset = startOffset + ae.slotInterval;

    const appointmentStart = ae.start.clone().add(startOffset, 'minutes');
    const appointmentEnd = ae.start.clone().add(endOffset, 'minutes');

    setSecondsToZero(appointmentStart); setSecondsToZero(appointmentEnd);

    const appointmentId = await repository.addAppointment({
      start: appointmentStart, 
      end: appointmentEnd, appointeeId, position, appointmentEventId });

    const soloGroup = await repository.getSoloGroupOfUser(appointeeId);

    const resourceId = await repository.addAppointmentResource(appointmentId);

    await resourceUsecase.addResourcePermissionToUserGroup({groupId: soloGroup.id, resourceId, permission: UPDATE});
  
    return appointmentId;
  }

  async function changeAppointment({userId, appointmentId, position}) {
    assert.ok(userId); assert.ok(appointmentId); assert.ok(position >= 0);

    const hasPermission = await hasAppointmentPermission({userId, appointmentId, permission: UPDATE});
    if (!hasPermission) throw new Error('Not permitted to change the appointment');

    const appointment = await repository.getAppointment(appointmentId); assert.ok(appointment);
    const appointmentEventId = appointment.appointmentEventId;

    const appointmentEvent = await repository.getAppointmentEvent(appointmentEventId); assert.ok(appointmentEventId);
    const existingAppointments = await repository.getAppointmentsOfAppointmentEvent(appointmentEventId);

    const filledPositions = existingAppointments.filter(ap => ap.id !== appointmentId).map(ap => ap.position);
    
    if (filledPositions.indexOf(position) >= 0) throw new Error('Position already occupied');
    if (position >= appointmentEvent.slotCount) throw new Error('Position out of range');

    const startOffset = appointmentEvent.slotInterval * position;
    const endOffset = startOffset + appointmentEvent.slotInterval;

    const start = appointmentEvent.start.clone().add(startOffset, 'minutes');
    const end = appointmentEvent.start.clone().add(endOffset, 'minutes');

    setSecondsToZero(start); setSecondsToZero(end);

    await repository.updateAppointment({appointmentId, position, start, end});
  }

  async function shareAppointmentEventWithUser({sharerId, shareeId, permission, appointmentEventId}) {
    assert.ok(sharerId); assert.ok(shareeId); assert.ok(appointmentEventId);
    assert.ok(resourceUsecase.checkPermissionCompatible({appointmentEventId}, permission));

    //sharer should atlest have permission that he attempts to share
    const sharerHasPermission = await hasAppointmentEventPermission({userId: sharerId, appointmentEventId, permission});
    if (!sharerHasPermission)
      throw new Error('Sharer does not have sufficient permission, to grant the permission');
    
    const resource = await repository.getAppointmentEventResource(appointmentEventId);

    const group = await repository.getSoloGroupOfUser(shareeId);

    await resourceUsecase.addResourcePermissionToUserGroup({
      groupId: group.id,
      resourceId: resource.id, permission});
  }

  /*
    @return @see repository.getAppointmentEvent
  */
  async function getAppointmentEvent(appointmentEventId) {
    assert.ok(appointmentEventId);
    return repository.getAppointmentEvent(appointmentEventId);
  }

  /*
    @return @see repository.getAppointmentsOfAppointmentEvent
  */
  async function getAppointmentsOfAppointmentEvent(appointmentEventId) {
    assert.ok(appointmentEventId);
    return repository.getAppointmentsOfAppointmentEvent(appointmentEventId);
  }

  async function getAppointmentsOfAppointee(userId) {
    assert.ok(userId);
    return repository.getAppointmentsOfAppointee(userId);
  }



  /*
    @return @see getUser
  */
  async function getAppointerOfAppointmentEvent(appointmentEventId) {
    assert.ok(appointmentEventId);

    const appointmentEvent = await repository.getAppointmentEvent(appointmentEventId); assert.ok(appointmentEvent);    
    return getUser(appointmentEvent.appointerId);
  }

  /*
    @return @see repository.getAppointment
  */
  async function getAppointment(appointmentId) {
    assert.ok(appointmentId);

    return repository.getAppointment(appointmentId);
  }

  /*
    @return @see repository.findUserById
  */
  async function getUser(userId) {
    return repository.findUserById(userId);
  }

  return {
    addAppointmentEvent,
    addAppointment,
    changeAppointment,
    getAppointmentEventsOfAppointer,
    getAppointerOfAppointmentEvent,
    getAppointmentsOfAppointmentEvent,
    getAppointment,
    getAppointmentEvent,
    getAllVisibleAppointmentResourcesOfUser,
    getAllVisibleAppointmentEventResourcesOfUser,
    getAppointmentsOfAppointee,
    getAllJoinableAppointmentEventsOfUser,
    getAllVisibleAppointmentEventsOfUser,
    shareAppointmentEventWithUser,
    getUser
  };
}

function setSecondsToZero(m) {
  m.set('seconds', 0);
  m.set('milliseconds', 0);
}