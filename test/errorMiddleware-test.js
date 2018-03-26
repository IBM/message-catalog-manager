/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: message-catalog-manager
 *   This project is licensed under the MIT License, see LICENSE
 */
'use strict';

var chai = require('chai');
var assert = chai.assert;
var httpMocks = require('node-mocks-http');
var sinon = require('sinon');
var expect = chai.expect;

var Middleware = require('../lib/middleware/errorMiddleware.js');
var CatalogedError = require('../lib/catalogedError.js');

describe('errorMiddleware', function () {

    it('can be constructed with a catalog index', function () {
        var testMiddleware = new Middleware(__dirname + '/catalog-index.json');
        assert.isFunction(testMiddleware);
    });

    describe('function', function () {
        var testMiddleware;
        var req;
        var res;
        var originalSendSpy;
        beforeEach(function () {
            testMiddleware = new Middleware(__dirname + '/catalog-index.json');
            req = httpMocks.createRequest({
                method: 'GET',
                url: '/blah/blah',
                params: {
                    id: 42
                }
            });
            res = httpMocks.createResponse();
            originalSendSpy = sinon.spy(res, "send");
        });

        afterEach(function () {
            originalSendSpy.restore();
        });

        it('does nothing for non error status codes', function () {
            var nextCalled = false;
            testMiddleware(req,res,function(){
                nextCalled = true;
            });
            assert.isTrue(nextCalled);
            var testMessage = "TEST MESSAGE";
            res.send(testMessage);
            assert(originalSendSpy.calledOnce,"Send should have been called once");
            expect(originalSendSpy.getCall(0).args[0],"sent message should not have been modified").to.equal(testMessage);
        });

        it('does nothing for error status codes without a catalogedError', function () {
            res.statusCode = 400;
            var nextCalled = false;
            testMiddleware(req,res,function(){
                nextCalled = true;
            });
            assert.isTrue(nextCalled);
            var testMessage = "TEST MESSAGE";
            res.send(testMessage);
            assert(originalSendSpy.calledOnce,"Send should have been called once");
            expect(originalSendSpy.getCall(0).args[0],"sent message should not have been modified").to.equal(testMessage);
        });

        it('formats the message for error status codes', function () {
            res.statusCode = 400;
            var nextCalled = false;
            testMiddleware(req,res,function(){
                nextCalled = true;
            });
            assert.isTrue(nextCalled);
            var testError = new CatalogedError('0002','exampleLocal','Example error',{id:"EXAMPLE ID"},[]);
            res.send(testError);
            assert(originalSendSpy.calledOnce,"Send should have been called once");
            var spyArg = originalSendSpy.getCall(0).args[0];
            expect(spyArg.message,"sent message should have a message property").to.exist;
            expect(spyArg.action,"sent message should have an action property").to.exist;
            expect(spyArg.detail,"sent message should have a detail property").to.exist;
        });

        it('passes the payload through when an error occurs', function () {
            res.statusCode = 400;
            var nextCalled = false;
            testMiddleware(req,res,function(){
                nextCalled = true;
            });
            assert.isTrue(nextCalled);
            var testError = new CatalogedError('error','error','Example error',{id:"EXAMPLE ID"},[]);
            res.send(testError);
            assert(originalSendSpy.calledOnce,"Send should have been called once");
            assert(originalSendSpy.calledOnce,"Send should have been called once");
            expect(originalSendSpy.getCall(0).args[0],"sent message should not have been modified").to.equal(testError);
        });
    });
});