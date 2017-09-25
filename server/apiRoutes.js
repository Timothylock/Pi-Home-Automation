/**
 * The routes of the api endpoints
 */
module.exports = (function () {
    'use strict';
    var express = require('express');
    var router = express.Router();
    var userController = require('./userController');
    var adminController = require('./adminController');

    router.use(function (req, res, next) {
        // log each request to the console
        console.log(req.method, req.url);

        // continue doing what we were doing and go to the route
        next();
    });

    /* User endpoints */
    router.get('/status', userController.getStatus);

    router.get('/log', userController.getHistory);

    router.route('/lights')
        .get(userController.getLights)
        .post(userController.postLights);

    router.route('/blinds')
        .post(userController.postBlinds);


    /* admin endpoints */
    router.route('/admin/shutdown')
        .post(adminController.postShutdown);

    router.get('/admin/version', adminController.getVersion);

    router.route('/admin/logs')
        .get(adminController.getLogs)
        .delete(adminController.deleteLog);

    router.route('/admin/users')
        .get(adminController.getUsers)
        .post(adminController.addUser)
        .delete(adminController.deleteUser);

    router.get('/admin/update', adminController.pullLatest);

    return router;
})();
