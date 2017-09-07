/**
 * Tests the errors
 */
var chai = require('chai');
var errors = require('./../../../server/responses/errors');
var httpMocks = require('node-mocks-http');

describe('error responses', function () {
    it("status 500", function (done) {
        var response = httpMocks.createResponse();

        response.send = function (payload) {
            if (JSON.stringify(payload) !== '{"status":"Internal error","code":9999,"details":"someerror"}') {
                done(new Error('Expected {"status":"Internal error","code":9999,"details":"someerror"}, but got ' + JSON.stringify(payload)));
                return;
            }

            if (response.statusCode !== 500) {
                done(new Error("Expected a status code of 500, but got " + response.statusCode));
                return;
            }

            done();
        };

        errors.Error500(9999, "someerror", response);
    });

    it("status 400", function (done) {
        var response = httpMocks.createResponse();

        response.send = function (payload) {
            if (JSON.stringify(payload) !== '{"status":"Bad Request","code":9999,"details":"someerror"}') {
                done(new Error('Expected {"status":"Bad Request","code":9999,"details":"someerror"}, but got ' + JSON.stringify(payload)));
                return;
            }

            if (response.statusCode !== 400) {
                done(new Error("Expected a status code of 400, but got " + response.statusCode));
                return;
            }

            done();
        };

        errors.Error400(9999, "someerror", response);
    });

    it("status 403", function (done) {
        var response = httpMocks.createResponse();

        response.send = function (payload) {
            if (JSON.stringify(payload) !== '{"status":"Forbidden","code":9999,"details":"someerror"}') {
                done(new Error('Expected {"status":"Forbidden","code":9999,"details":"someerror"}, but got ' + JSON.stringify(payload)));
                return;
            }

            if (response.statusCode !== 403) {
                done(new Error("Expected a status code of 403, but got " + response.statusCode));
                return;
            }

            done();
        };

        errors.Error403(9999, "someerror", response);
    });
});

