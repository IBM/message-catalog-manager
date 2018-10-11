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
var events = require('events');
var formattingMiddleware = require('../lib/middleware/errorMiddleware.js');
var CatalogedError = require('../lib/catalogedError.js');

describe('formattingMiddleware', function () {

    var testMiddleware;
    var req;
    var res;
    var originalSendSpy;
    beforeEach(function(){
        req = httpMocks.createRequest({
            method: 'GET',
            url: '/blah/blah',
            params: {id: 42}
        });
        res = httpMocks.createResponse({eventEmitter: events.EventEmitter});
        originalSendSpy = sinon.spy(res, "send");
    });

    afterEach(function () {
        originalSendSpy.restore();
    });

    it('can be constructed with a catalog index', function () {
        var testMiddleware = formattingMiddleware(__dirname + '/catalog-index.json');
        assert.isFunction(testMiddleware);
    });

    it('can be constructed with an optional pre-processor', function() {
        function myPreProcessorFunction() {}
        var testMiddleware = formattingMiddleware(__dirname + '/catalog-index.json', myPreProcessorFunction);
        assert.isFunction(testMiddleware);
    });

    describe('function without pre-processor', function () {

        beforeEach(function () {
            testMiddleware = formattingMiddleware(__dirname + '/catalog-index.json');
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
            var testError = new CatalogedError('MESSAGE_NOT_IN_CATALOG','error','Example error',{id:"EXAMPLE ID"},[]);
            res.send(testError);
            assert(originalSendSpy.calledOnce,"Send should have been called once");
            expect(originalSendSpy.getCall(0).args[0],"sent message should not have been modified").to.equal(JSON.stringify(testError));
        });

        it('when message is not found and returns unformatted without a stack', function () {
            res.statusCode = 400;
            var nextCalled = false;
            testMiddleware(req,res,function(){
                nextCalled = true;
            });
            assert.isTrue(nextCalled);
            var testError = new CatalogedError('MESSAGE_NOT_IN_CATALOG','error','Example error',{id:"EXAMPLE ID"},[]);
            // cloning error object properties can make stack visible
            let copyTestError  = {};
            let testErrorProperties = Object.getOwnPropertyNames(testError);
            testErrorProperties.forEach(property =>{
                copyTestError[property] = testError[property];
            });
            res.send(copyTestError);
            expect(originalSendSpy.getCall(0).args[0]).to.not.include('stack');
        });

    });

    describe('function with pre-processor', function () {
        var preProcessorStub;
        var nextStub;
        beforeEach(function () {
            preProcessorStub = sinon.stub();
            nextStub = sinon.stub();
            testMiddleware = formattingMiddleware(__dirname + '/catalog-index.json', preProcessorStub);
            res.statusCode = 400;
        });

        it('uses synchronous pre-processor to transform before formatting the message', function () {
            // pre-processor function which runs synchronously, returning {object}
            preProcessorStub.callsFake(function(msg){
                // clone message, and update inserts
                var newMsg = JSON.parse(JSON.stringify(msg));
                newMsg.namedInserts.id = 'transformed-sync';
                return newMsg;
            });
            testMiddleware(req,res,nextStub);
            expect(nextStub).to.have.callCount(1);
            var testError = new CatalogedError('0002','exampleLocal','Example error',{id:"this-insert-gets-replaced",number:1,boolean:true},[]);
            res.send(testError);

            expect(preProcessorStub).to.have.callCount(1);
            expect(originalSendSpy).to.have.callCount(1);
            var sentFormattedMessage = originalSendSpy.getCall(0).args[0];
            expect(sentFormattedMessage.message).to.equal('This is an example message with special inserts transformed-sync - 1 - true');
        });

        it('sends HTTP500 unformatted original message when synchronous pre-processor throws', function (done) {
            // pre-processor function which runs synchronously, returning {object}
            preProcessorStub.throws(new Error('fake error when transforming message'));
            testMiddleware(req,res,nextStub);
            expect(nextStub).to.have.callCount(1);
            var testError = new CatalogedError('0002','exampleLocal','Example error',{id:"this-insert-NOT-replaced"},[]);

            res.on('send', function(){
                try {
                    expect(preProcessorStub).to.have.callCount(1);
                    expect(originalSendSpy).to.have.callCount(1);
                    expect(res._getStatusCode()).to.equal(500);
                    var sentMessage = originalSendSpy.getCall(0).args[0];
                    expect(sentMessage).to.equal(JSON.stringify(testError));
                    done();
                } catch (e) {
                    done(e);
                }
            });

            res.send(testError);
        });

        it('sends unformatted message without a stack property when synchronous pre-processor throws', function (done) {
            // pre-processor function which runs synchronously, returning {object}
            preProcessorStub.throws(new Error('fake error when transforming message'));
            testMiddleware(req,res,nextStub);
            expect(nextStub).to.have.callCount(1);
            var testError = new CatalogedError('0002','exampleLocal','Example error',{id:"this-insert-NOT-replaced"},[]);
            // cloning error object properties can make stack visible
            let copyTestError  = {};
            let testErrorProperties = Object.getOwnPropertyNames(testError);
            testErrorProperties.forEach(property =>{
                copyTestError[property] = testError[property];
            });

            res.on('send', function(){
                try {
                    var sentMessage = originalSendSpy.getCall(0).args[0];
                    expect(sentMessage).to.not.include('stack');
                    done();
                } catch (e) {
                    done(e);
                }
            });

            res.send(copyTestError);
        });


        it('uses asynchronous pre-processor to transform before formatting the message', function (done) {
            // pre-processor function which runs asynchronously, returning {Promise<object>}
            preProcessorStub.callsFake(function(msg){
                // clone message, and update inserts
                var newMsg = JSON.parse(JSON.stringify(msg));
                newMsg.namedInserts.id = 'transformed-async';
                return Promise.resolve(newMsg);
            });
            testMiddleware(req,res,nextStub);
            expect(nextStub).to.have.callCount(1);
            var testError = new CatalogedError('0002','exampleLocal','Example error',{id:"this-insert-gets-replaced",number:1,boolean:true},[]);

            res.on('send', function(){
                try {
                    expect(preProcessorStub).to.have.callCount(1);
                    expect(originalSendSpy).to.have.callCount(1);
                    var sentFormattedMessage = originalSendSpy.getCall(0).args[0];
                    expect(sentFormattedMessage.message).to.equal('This is an example message with special inserts transformed-async - 1 - true');
                    done();
                } catch (e) {
                    done(e);
                }
            });

            res.send(testError);
        });

        it('sends HTP500 unformatted original message when asynchronous pre-processor rejects', function (done) {
            // pre-processor function which runs asynchronously, returning {Promise<object>}
            preProcessorStub.rejects(new Error('fake error when transforming message'));
            testMiddleware(req,res,nextStub);
            expect(nextStub).to.have.callCount(1);
            var testError = new CatalogedError('0002','exampleLocal','Example error',{id:"this-insert-NOT-replaced"},[]);

            res.on('send', function(){
                try {
                    expect(preProcessorStub).to.have.callCount(1);
                    expect(originalSendSpy).to.have.callCount(1);
                    expect(res._getStatusCode()).to.equal(500);
                    var sentMessage = originalSendSpy.getCall(0).args[0];
                    expect(sentMessage).to.equal(JSON.stringify(testError));
                    done();
                } catch (e) {
                    done(e);
                }
            });

            res.send(testError);
        });

        it('sends unformatted message without a stack property when asynchronous pre-processor rejects', function (done) {
            // pre-processor function which runs asynchronously, returning {Promise<object>}
            preProcessorStub.rejects(new Error('fake error when transforming message'));
            testMiddleware(req,res,nextStub);
            expect(nextStub).to.have.callCount(1);
            var testError = new CatalogedError('0002','exampleLocal','Example error',{id:"this-insert-NOT-replaced"},[]);
            // cloning error object properties can make stack visible
            let copyTestError  = {};
            let testErrorProperties = Object.getOwnPropertyNames(testError);
            testErrorProperties.forEach(property =>{
                copyTestError[property] = testError[property];
            });

            res.on('send', function(){
                try {
                    var sentMessage = originalSendSpy.getCall(0).args[0];
                    expect(sentMessage).to.not.include('stack');
                    done();
                } catch (e) {
                    done(e);
                }
            });

            res.send(copyTestError);
        });


    });
});
