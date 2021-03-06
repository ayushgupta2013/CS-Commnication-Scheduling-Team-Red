const moment = require('moment-timezone'); moment.tz.setDefault('utc');
const assert = require('assert');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const app = express();
const port = process.env.PORT || 8080;
const cors = require('cors');
const constants = require('./constants');

//HTTP: application/json Content-type headers are automatically made available in req.body
app.use(bodyParser.json());

//logs incoming request if process.env.NODE_ENV !== 'production'(i think)
app.use(morgan('dev'));

//cookie parsing from headers, and available in req.headers.cookie (or req.headers.cookies forgot exact)
app.use(cookieParser());

app.use(cors());

//this process is assigned a LISTEN SOCKET and incoming requests with
//matching PORT is notified as event to the socket object abstraction.
//express is built on top of http core module which is built on top of 
//socket module
app.listen(port, function() {
    console.log("Port: " + port);

    const mysql = require('mysql');
    const dbconfig = require('./config/database');

    //sql connection builder object, but not connected until
    //connection.connect (see builder pattern)
    const connection = mysql.createConnection(dbconfig.connection);

    connection.connect(function(error) {
        if (error) throw error;

        console.log('connected to db');
        connection.query('USE calendar');

        const {repository: resourceRepository, usecase: resourceUsecase} = require('./resource')(connection);
        const {controller: userController, repository: userRepository} = require('./user')(connection);
        const { controller: registerController, usecase: registerUsecase } = require('./register_login')(connection, {userRepository, resourceRepository});
        const {repository: groupRepository, usecase: groupUsecase, controller: groupController} = require('./group')(connection, {resourceUsecase, resourceRepository, userRepository, registerUsecase });
        const {controller: appointmentController, usecase: appointmentUsecase, repository: appointmentRepository} = require('./appointment')(connection, {userRepository, resourceRepository, resourceUsecase});
        const {controller: colorController} = require('./color')(connection);
        const { controller: eventController, usecase: eventUsecase} = require('./event')(connection, {resourceRepository, resourceUsecase, userRepository});
        const {controller: calendarEventController, usecase: calendarEventUsecase} = require('./calendar_event')(connection, {userRepository, resourceUsecase, resourceRepository, eventUsecase, appointmentUsecase, appointmentRepository});
    
        app.post('/login', registerController.login);
        app.get('/colors', colorController.getColors);

        //thou shall not pass
        app.use(async function(req, res, next) {
            try {
                const authtoken = req.headers.authtoken;
                const user = await userRepository.findUserByLoginToken(authtoken); assert.ok(user);
                req.user = user;

                next();
            } catch(error) {
                res.send({success: false, message: 'Unauthorized access'});
            }
        });

        app.get('/appointment-event', appointmentController.getAppointmentEvents);
        app.get('/appointment-event/:id', appointmentController.getSpecificAppointmentEvent);
        app.post('/appointment-event', appointmentController.addAppointmentEvent);
        app.post('/appointment-event/share', appointmentController.shareAppointmentEvent);

        app.post('/appointment', appointmentController.addAppointment);
        app.get('/appointment', appointmentController.getAppointments);
        app.put('/appointment/:id', appointmentController.changeAppointment);
        app.get('/appointment/:id', appointmentController.getSpecificAppointment);

        app.get('/user', userController.getUsers);

        app.get('/calendar-events', calendarEventController.getCalendarEvents);
        app.post('/calendar-events/share', calendarEventController.shareCalendarWithUser);

        app.post('/events', eventController.addEvent);
        app.post('/events/share', eventController.shareEvent);
        app.get('/events', eventController.getEvents);
        app.put('/events/:id', eventController.editEvent);

        app.post('/groups/share', groupController.shareGroupWithUser);
        app.get('/groups/me', groupController.getMyGroups);
        app.get('/groups/:id', groupController.getGroup);
        app.put('/groups/:id', groupController.editGroup);
        app.post('/groups', groupController.addGroup);
        app.post('/groups/:id/members', groupController.addGroupMembers);
        app.delete('/groups/:id/members', groupController.removeGroupMembers);
        app.post('/groups/:id/members/csv', groupController.addGroupMembersAsCsv);
        app.delete('/groups/:id/members/csv', groupController.removeGroupMembersAsCsv);

        app.use(async function(req, res, next) {
            if (req.user.email !== constants.ADMIN_EMAIL) {
                res.send({success: false, message: 'Only Admin access'});
                return;
            }
            next();
        });

        app.post('/create/student', registerController.registerStudent);
        app.post('/create/student/csv', registerController.registerStudentAsCsv);
        app.post('/create/faculty', registerController.registerFaculty);
    });

    //sql TCP connection
//     connection.connect(function(error) {
//         if (error) throw error;
        
//         console.log('connected to db');
//         connection.query('USE calendar');

//         //dependency graph:
//         //repository depends on mysql connection
//         //usecase depends on repository
//         //express route handlers depend on usecase/repository
//         //we can seperate controller into different file, and abstract 
//         //that as well. this is good for now though
//         const repository = require('./repository')(connection);
//         const loginUsecase = require('./loginUsecase')(repository);
        
//         /*body
//             {username: 'name'}
//         */
//         app.post('/request-password-change', async function(req, res, next) {
//             try {
//                 const username = req.body.username; assert.ok(username);
//                 await loginUsecase.requestPasswordUpdate(username);
//                 res.send({success: true}); 
//             } catch(err) {
//                 res.send({success: false, message: err.message });
//             }
//         });

//         /*body
//             {otp: '33333', username: 'name'}
//         */
//         app.post('/verify-password-change', async function(req, res, next) {
//             try {
//                 const username = req.body.username; const otp = req.body.otp;
//                 assert.ok(username); assert.ok(otp);
//                 const isOk = await loginUsecase.verifyPasswordOtp(username, otp);
//                 res.send({success: true, otpVerified: isOk});
//             } catch(err) {
//                 res.send({success: false, message: err.message });
//             }
//         });

//         /*body
//             {otp: '33333', username: 'name', password: 'newpassword'}
//         */
//         app.post('/change-password', async function(req, res, next) {
//             try {
//                 const pwd = req.body.password; const username = req.body.username; const otp = req.body.otp;
//                 assert.ok(username); assert.ok(otp); assert.ok(pwd);
    
//                 const isOtpGood = await loginUsecase.verifyPasswordOtp(username, otp);
//                 if (!isOtpGood) return res.send({success: false, message: 'Otp did not match'});
    
//                 await loginUsecase.updatePassword(username, pwd);
//                 res.send({success: true});
//             } catch(err) {
//                 res.send({success: false, message: err.message });
//             }
//         });  
});