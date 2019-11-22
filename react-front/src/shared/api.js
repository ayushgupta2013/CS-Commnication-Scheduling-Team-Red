import axios from 'axios';
//import moment from 'moment';

export function login({username, password}) {
    return axios
        .post('/login', {username, password})
        .then(res => res.data)
        .then(res => {
            if (!res.success) throw new Error(res.message);
            return res.user;
        });
}

export function createEvent({ name, description, image, start, end, color, groupId }) {
    return axios
        .post('/events', { name, description, image, start, end, color, groupId }, getAuthHeaders())
        .then(res => res.data)
        .then(res => {
            if (!res.success) throw new Error(res.message);
        });
}

export function getCalendarEvents() {
    return axios
        .get('/calendar-events', getAuthHeaders())
        .then(res => res.data)
        .then(res => {
            if (!res.success) throw new Error(res.message);
            return res.data;
        });
}

export function logout() {
    return Promise.resolve()
        .then(() => {
            localStorage.removeItem('user');
        });
}



export function addAppointmentEvent({name, start, slotCount, slotInterval, description, color, groupId}) {
    return axios
        .post('/appointment-event', {name, start, slotCount, slotInterval, description, color, groupId}, getAuthHeaders())
        .then(res => res.data)
        .then(res => {
            if (!res.success) throw new Error(res.message);
            return;
        });
}

export function getAppointmentEvent(id){
    return axios
        .get('/appointment-event?appointerId='+id, getAuthHeaders())
        .then(res => res.data)
        .catch(res => {
            if(!res.success) throw new Error(res.message);
            return "Error";
        });
}

/*
    @return Promise<Array<{
        id,
        description,
        name,
        color,
        start,
        end,
        slotInterval,
        slotCount,
        appointerId
    }>>
*/
export function getJoinableAppointmentEvents() {
    return axios
        .get('/appointment-event?filters=joinable', getAuthHeaders())
        .then(res => res.data)
        .then(res => {
            if(!res.success) throw new Error(res.message);
            return res.appointmentEvents;
        });
}

export function shareCalendar({userId, permission}) {
    return axios
        .post('/calendar-events/share', {userId, permission}, getAuthHeaders())
        .then(res => res.data)
        .then(res => {
            if(!res.success) throw new Error(res.message);
        });
}

/*
    @return Promise<Array<{
        id: number,
        cwid: number,
        fname: string,
        lname: string,
        email: string,
        userType: string
    }>>
*/
export function getAllUsers() {
    return axios
        .get('/user?filters=faculty,student', getAuthHeaders())
        .then(res => res.data)
        .then(res => {
            if(!res.success) throw new Error(res.message);
            return res.users;
        });
}

/*
    @see getAllUsers
*/
export function getStudents() {
    return axios
        .get('/user?filters=student', getAuthHeaders())
        .then(res => res.data)
        .then(res => {
            if(!res.success) throw new Error(res.message);
            return res.users;
        });
}

/*
    @see getAllUsers
*/
export function getFaculties() {
    return axios
        .get('/user?filters=faculty', getAuthHeaders())
        .then(res => res.data)
        .then(res => {
            if(!res.success) throw new Error(res.message);
            return res.users;
        });
}


/*
    NOTE: @deprecated, use getFaculites instead
    @return faculties field would have, Promise<Array<{
        id,
        fname,
        lname,
        email,
        cwid
    }>>
*/
export function getFaculty() {
    return axios
    .get('/user?filters=faculty', getAuthHeaders())
    .then(res => res.data)
    .catch(res => {
        if(!res.success) throw new Error(res.message);
    });
}

//this is my created groups, and groups that have been shared to me
/*
    @return Promise<Array<{
        id: number,
        name: string,
        description: string,
        creatorId: number,
        permission: string ('UPDATE' | 'READ')
    }>>
*/
export function getAllVisibleGroups() {
    return axios
    .get('/groups/me?filters=all_visible', getAuthHeaders())
    .then(res => res.data)
    .then(res => {
        if(!res.success) throw new Error(res.message);
        return res.groups;
    });
}

/*
    @return Promise<Array<{
        id: number,
        name: string,
        description: string,
        creatorId: number,
        permission: string ('UPDATE' | 'READ')
    }>>
*/
export function getMyCreatedGroups() {
    return axios
        .get('/groups/me', getAuthHeaders())
        .then(res => res.data)
        .then(res => {
            if(!res.success) throw new Error(res.message);
            return res.groups;
        });
}

/*
    @return Promise<{
        id: number,
        name: string,
        description: string,
        creatorId: number,
        permission: string
        members: Array<{
          id: number,
          cwid: number,
          fname: string,
          lname: string,
          email: string
        }>
    }>
*/
export function getSpecificGroup(id) {
    return axios
        .get(`/groups/${id}`, getAuthHeaders())
        .then(res => res.data)
        .then(res => {
            if(!res.success) throw new Error(res.message);
            return res.group;
        });
}

/*
    @return Promise<number>, id of the created group
*/
export function createGroup({name, description}) {
    return axios
        .post('/groups', {name, description}, getAuthHeaders())
        .then(res => res.data)
        .then(res => {
            if(!res.success) throw new Error(res.message)
            return res.groupId;
        });
}

/*
    @return Promise<void>
*/
export function addGroupMembers(groupId, cwids) {
    
    const url = `/groups/${groupId}/members`;
    return axios
        .post(url, {cwids}, getAuthHeaders())
        .then(res => res.data)
        .then(res => {
            if(!res.success) throw new Error(res.message);
        });
}

/*
    @return Promise<void>
    NOTE: axios delete needs special treatment for DELETE requests
    @see  https://github.com/axios/axios/issues/897#issuecomment-343715381
*/
export function removeGroupMembers(groupId, cwids) {
    const url = `/groups/${groupId}/members`;
    return axios
        .delete(url, {data: { cwids }, headers: getAuthHeaders().headers }, )
        .then(res => res.data)
        .catch(res => {
            if(!res.success) throw new Error(res.message);
        })
}

export function shareGroup({groupId, userId, permission}) {
    return axios
        .post('/groups/share', {groupId, userId, permission}, getAuthHeaders())
        .then(res => res.data)
        .then(res => {
            if(!res.success) throw new Error(res.message);
        });
}

function getAuthHeaders() {
    const { loginToken: authtoken } = JSON.parse(localStorage.getItem('user'));
    return {
        headers: { 'Content-Type': 'application/json', 'authtoken': authtoken },
    }
}

/*TODO: createEvent, createFaculty and createStudent here*/