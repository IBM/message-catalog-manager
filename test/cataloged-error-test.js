/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: message-catalog-manager
 *   This project is licensed under the MIT License, see LICENSE
 */
'use strict';

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

var CatalogedError = require('../lib/catalogedError.js');

describe('catalogedError testcases', function () {


    it('with all parameters supplied', function (done) {
        var messageText = "Test Error";
        var messagePositionalInserts = [1,2,3,4];
        var catalog = "my-cat";
        var messageNamedInserts = {SOME:"VALUE"};
        try {
            throw new CatalogedError("1",catalog,messageText,messageNamedInserts,messagePositionalInserts);
        }
        catch (err){
            expect(err).to.be.an.instanceof(Error);
            expect(err).to.be.an.instanceof(CatalogedError);
            assert.isArray(err.positionalInserts,"positionalInserts should be an array");
            assert.isDefined(err.messageNumber,"messageNumber should be defined");
            assert.isObject(err.namedInserts,"namedInserts should be defined");
            expect(err.messageNumber).to.equal("1");
            expect(err.message).to.equal(messageText);
            expect(err.catalog).to.equal(catalog);
            console.log("Err:"+JSON.stringify(err));
            done();
        }
    });

    it('with optional parameters missing', function (done) {
        var messageText = "Test Error";
        try {
            throw new CatalogedError(undefined,undefined,messageText);
        }
        catch (err){
            expect(err).to.be.an.instanceof(Error);
            expect(err).to.be.an.instanceof(CatalogedError);
            assert.isArray(err.positionalInserts,"positionalInserts should be an array");
            assert.isObject(err.namedInserts,"namedInserts should be an object");
            assert.isDefined(err.messageNumber,"messageNumber should be defined");
            expect(err.messageNumber).to.equal("DEFAULT");
            expect(err.message).to.equal(messageText);
            expect(err.catalog).to.equal("DEFAULT");
            console.log("Err:"+JSON.stringify(err));
            done();
        }
    });

    it('constructor throws on unsupported named insert parameter', function () {
        function createBadCatalogedError() {
            var messageText = "Test Error";
            var messagePositionalInserts = [1,2,3,4];
            var catalog = "my-cat";
            var messageNamedInserts = 'bad'; // should be object
            new CatalogedError("1", catalog, messageText, messageNamedInserts, messagePositionalInserts);
        }
        expect(createBadCatalogedError).throws("named inserts must be an object if defined");
    });

    it('constructor throws on unsupported named insert type', function () {
        function createBadCatalogedError() {
            var messageText = "Test Error";
            var messagePositionalInserts = [1,2,3,4];
            var catalog = "my-cat";
            var messageNamedInserts = {badInsert: function(){}};
            new CatalogedError("1", catalog, messageText, messageNamedInserts, messagePositionalInserts);
        }
        expect(createBadCatalogedError).throws("namedInserts 'badInsert' is of unsupported type function");
    });

    it('constructor throws on unsupported positional insert parameter', function () {
        function createBadCatalogedError() {
            var messageText = "Test Error";
            var messagePositionalInserts = {}; // should be array
            var catalog = "my-cat";
            var messageNamedInserts = {myInsert: 'myValue'};
            new CatalogedError("1", catalog, messageText, messageNamedInserts, messagePositionalInserts);
        }
        expect(createBadCatalogedError).throws("positional inserts must be an array if defined");
    });

    it('constructor throws on unsupported positional insert type', function () {
        function createBadCatalogedError() {
            var messageText = "Test Error";
            var messagePositionalInserts = [1,function(){},3];
            var catalog = "my-cat";
            var messageNamedInserts = {myInsert: 'myValue'};
            new CatalogedError("1", catalog, messageText, messageNamedInserts, messagePositionalInserts);
        }
        expect(createBadCatalogedError).throws("positionalInserts value with index: '1' is of unsupported type function");
    });
});