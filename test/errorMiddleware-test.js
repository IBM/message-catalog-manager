/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: message-catalog-manager
 *   This project is licensed under the MIT License, see LICENSE
 */
'use strict';

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var sinon = require('sinon');
var httpMocks = require('node-mocks-http');
var Middleware = require('../lib/middleware/errorMiddleware.js');
var CatalogedError = require('../lib/catalogedError.js');

describe('errorMiddleware', function () {

    var testMiddleware;
    var req;
    var res;
    var originalSendSpy;
    beforeEach(function(){
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

    it('can be constructed with a catalog index', function () {
        var testMiddleware = new Middleware(__dirname + '/catalog-index.json');
        assert.isFunction(testMiddleware);
    });

    it('can be constructed with an optional pre-processor', function() {
        function myPreProcessorFunction() {}
        var testMiddleware = new Middleware(__dirname + '/catalog-index.json', myPreProcessorFunction);
        assert.isFunction(testMiddleware);
    });

    describe('function without pre-processor', function () {

        beforeEach(function () {
            testMiddleware = new Middleware(__dirname + '/catalog-index.json');
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

    describe('function with pre-processor', function () {
        var preProcessorStub;
        beforeEach(function () {
            preProcessorStub = sinon.stub();
            testMiddleware = new Middleware(__dirname + '/catalog-index.json', preProcessorStub);
        });

        it('calls pre-processor to transform before formatting the message', function () {
            preProcessorStub.callsFake(function(msg){
                var newMsg = JSON.parse(JSON.stringify(msg));
                newMsg.namedInserts.id = 'transformed';
                return newMsg;
            });
            res.statusCode = 400;
            var nextCalled = false;
            testMiddleware(req,res,function(){
                nextCalled = true;
            });
            assert.isTrue(nextCalled);
            var testError = new CatalogedError('0002','exampleLocal','Example error',{id:"EXAMPLE ID"},[]);
            res.send(testError);

            expect(preProcessorStub).to.have.callCount(1);
            var sentFormattedMessage = originalSendSpy.getCall(0).args[0];
            expect(sentFormattedMessage.message).to.equal('This is an example message with a special insert transformed {number} {boolean}');
        });
    });
});