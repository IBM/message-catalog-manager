/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: message-catalog-manager
 *   This project is licensed under the MIT License, see LICENSE
 */
'use strict';

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var expect = chai.expect;
chai.use(chaiAsPromised);
var sinonChai = require("sinon-chai");
chai.use(sinonChai);
var MessageCatalogManager = require("../index.js").messageCatalogManager;
var CatalogedError = require('../lib/catalogedError.js');
var messageCatLib = require("../lib/message-catalog-manager.js");

describe('MessageCatalogManager', function () {

    var MC =  new MessageCatalogManager(__dirname + "/catalog-index.json");

    describe('getMessage', function () {

        it('returns a resolved message in the default locale', function () {
            var message = MC.getMessage("exampleLocal", "0001", {}, []);
            expect(message.message).to.equal("This is an example message");
            expect(message.action).to.equal("Write a real message");
            expect(message.url).to.equal("https://github.com/IBM/message-catalog-manager/README.md");
        });
        it('returns a resolved message in the default locale with no action', function () {
            var message = MC.getMessage("exampleLocal", "0006", {}, []);
            expect(message.message).to.equal("This is an example message with no action");
            expect(message.action).to.not.exist;
        });
        it('returns a resolved message in english locale', function () {
            var message = MC.getMessage("exampleLocal", "0001", {}, [], "en");
            expect(message.message).to.equal("This is an example message");
        });
        it('returns a resolved message in a different locale', function () {
            var message = MC.getMessage("exampleLocal", "0001", {}, [], "jp");
            expect(message.message).to.equal("This is an example message for japanese catalog");
        });
        it('returns a resolved message in the default locale if the given one does not exist', function () {
            var message = MC.getMessage("exampleLocal", "0001", {}, [], "ro");
            expect(message.message).to.equal("This is an example message");
        });
        it('returns a resolved message in default locale when given a code that does not exist in a different locale', function () {
            var message = MC.getMessage("exampleLocal", "0004", {}, [], "de");
            expect(message.message).to.equal("This is a message only in the default catalog");
        });
        it('returns a resolved message with special {id} insert in the default locale', function () {
            var message = MC.getMessage("exampleLocal", "0002", {id:"test-id", number: 0, boolean: true}, []);
            expect(message.message).to.equal("This is an example message with special inserts test-id - 0 - true");
        });
        it('returns a resolved message with special {id} insert in english locale', function () {
            var message = MC.getMessage("exampleLocal", "0002", {id:"test-id-en", number: 1, boolean: false}, [], "en");
            expect(message.message).to.equal("This is an example message with special inserts test-id-en - 1 - false");
        });
        it('returns a resolved message with special {id} insert in a different locale', function () {
            var message = MC.getMessage("exampleLocal", "0002", {id:"test-id-de"}, [], "de");
            expect(message.message).to.equal("This is an example message with a special insert test-id-de, in german locale");
        });
        it('returns a resolved message with special {id} insert in the default locale if the given one does not exist', function () {
            var message = MC.getMessage("exampleLocal", "0002", {id:"test-id-ro", number: 1, boolean: false}, [], "ro");
            expect(message.message).to.equal("This is an example message with special inserts test-id-ro - 1 - false");
        });
        it('returns a resolved message with special {id} insert for non-string values', function () {
            var message = MC.getMessage("exampleLocal", "0002", {id: null, number: NaN, boolean: undefined}, []);
            expect(message.message).to.equal("This is an example message with special inserts null - NaN - undefined");
        });
        it('returns a resolved message with positional inserts in the default locale', function () {
            var message = MC.getMessage("exampleLocal", "0003", {}, ["one", 2, "three", true]);
            expect(message.message).to.equal("This is an example message with positional inserts one 2 three true");
        });
        it('returns a resolved message with positional inserts in english locale', function () {
            var message = MC.getMessage("exampleLocal", "0003", {}, [1, 2, "three", true, null], "en");
            expect(message.message).to.equal("This is an example message with positional inserts 1 2 three true");
        });
        it('returns a resolved message with positional inserts in a different locale', function () {
            var message = MC.getMessage("exampleLocal", "0003", {}, ["eins", "2", "drei"], "de");
            expect(message.message).to.equal("This is an example message with positional inserts eins 2 drei, in german locale");
        });
        it('returns a resolved message with positional inserts in the default locale if the given one does not exist', function () {
            var message = MC.getMessage("exampleLocal", "0003", {}, ["one", "2", "three", true], "ro");
            expect(message.message).to.equal("This is an example message with positional inserts one 2 three true");
        });
        it('returns a resolved message with positional inserts for non-string values', function () {
            var message = MC.getMessage("exampleLocal", "0003", {}, [null, undefined, NaN, Infinity]);
            expect(message.message).to.equal("This is an example message with positional inserts null undefined NaN Infinity");
        });
        it('returns a resolved message with positional inserts that are objects stringified', function () {
            var insertObj = {iam: 'an object'};
            var insertEmptyObj = {};
            var insertObjCustomToString = {toString: function(){return 'custom_to_string_value';}};
            var message = MC.getMessage("exampleLocal", "0003", {}, ['ImAString', insertObj, insertEmptyObj, insertObjCustomToString]);
            expect(message.message).to.equal("This is an example message with positional inserts ImAString [object Object] [object Object] custom_to_string_value");
        });
        it('returns a resolved message with positional inserts that are arrays stringified', function () {
            var insertArr = ["item1", "item2"];
            var insertEmptyArr = [];
            var insertArrOfManyTypes = ["string", 123.4, {iam: 'an object'}, undefined, null];
            var message = MC.getMessage("exampleLocal", "0003", undefined, [insertArr, insertEmptyArr, insertArrOfManyTypes, 'lastInsert']);
            expect(message.message).to.equal("This is an example message with positional inserts item1,item2  string,123.4,[object Object],, lastInsert");
        });
        it('throws if message not matched in a valid catalog', function () {
            var test = function() { MC.getMessage("exampleLocal", "invalid_message"); };
            expect(test).to.throw(Error, /Message invalid_message not found in catalog exampleLocal/);
        });
        it('throws if no message property in message', function () {
            var test = function() { MC.getMessage("exampleLocal", "0005", {}, []); };
            expect(test).to.throw(Error, /Message 0005 found in catalog exampleLocal but without message property/);
        });
        it('throws if catalog not found', function () {
            var test = function() { MC.getMessage("wibble", "invalid_message"); };
            expect(test).to.throw(Error, /Catalog wibble not found/);
        });
        it('returns additional information (namedInserts) if verbose option is set', function () {
            var message =  MC.getMessage("exampleLocal", "0007", {foo:"bar"},[],"en", 1);
            expect(message.namedInserts).to.deep.equal({key:"value",foo:"bar"});
        });
        it('throws an error if a namedInserts value has unsupported type', function() {
            function myFunction(){}
            var test = function () {MC.getMessage("exampleLocal", "0007", {myInsert: myFunction},{},"en", 1);};
            expect(test).to.throw(Error, /namedInserts 'myInsert' is of unsupported type function/);
        });

        it('throws an error if a positionalInserts value has unsupported type', function() {
            function myFunction(){}
            var test = function () {MC.getMessage("exampleLocal", "0007", {},[myFunction],"en", 1);};
            expect(test).to.throw(Error, /positionalInserts value with index: '0' is of unsupported type function/);
        });

        it('returns a combined notification context object if message.namedInserts exists', function() {
            var message = MC.getMessage("exampleLocal", "0007", {foo:"bar", boo: true, num: 0}, [], "en", 1);
            expect(message.namedInserts).to.deep.equal({foo:"bar",boo: true, num: 0, key:"value"});
        });
        it('returns notification context object if message.namedInserts does not exists', function() {
            var message = MC.getMessage("exampleLocal", "0001", {foo:"bar"}, undefined, "en", 1);
            expect(message.namedInserts).to.deep.equal({foo:"bar"});
        });


    });

    describe('checkCatalog', function () {
        it('throws error for unknown catalog', function () {
            var test = function() { MC.checkCatalog("wibble"); };
            expect(test).to.throw(Error, /Catalog wibble not found/);
        });
        it('throws error for unsupported catalog index url', function () {
            var testInvalid = function() { MC.checkCatalog("exampleInvalidPath"); };
            expect(testInvalid).to.throw(/Invalid Catalog Index Url/);
        });
        it('throws error for catalog index url wrong type', function () {
            var testInvalid = function() { MC.checkCatalog("exampleInvalidEntry"); };
            expect(testInvalid).to.throw(/Catalog Index Url not a string/);
        });
        it('returns true when resolved from file path default locale', function () {
            var catalog = MC.checkCatalog("exampleLocal");
            expect(catalog).to.be.true;
        });
        it('throws error for remote catalog not yet supported for default locale', function () {
            var testRemote = function() { MC.checkCatalog("exampleRemote"); };
            expect(testRemote).to.throw(/Remote catalogs not yet supported/);
        });
    });

    describe('getCatalogedErrorMessage', function () {
        it('returns a message error without inserts', function() {
            var messageText = "Test Error";
            var catalogedError = new CatalogedError('0001','exampleLocal', messageText);
            var message = MC.getCatalogedErrorMessage(catalogedError);
            expect(message.message).to.equal('This is an example message');
            expect(message.action).to.equal('Write a real message');
        });
        it('returns a message error with inserts', function() {
            var messageText = "Test Error with inserts {0} {1} {2} {3} {4}";
            var messageInserts = [1,2,3,4,5];
            var catalogedError = new CatalogedError('0003','exampleLocal', messageText,{},messageInserts);
            var message = MC.getCatalogedErrorMessage(catalogedError);
            expect(message.message).to.equal("This is an example message with positional inserts 1 2 3 4");
        });
        it('tolerates V0 style errors', function() {
            var messageText = "Test Error with inserts {0} {1} {2} {3} {4}";
            var messageInserts = [1,2,3,4,5];
            var catalogedError = new CatalogedError('0003','exampleLocal', messageText,{},messageInserts);
            catalogedError.inserts = catalogedError.positionalInserts;
            catalogedError.positionalInserts = undefined;
            var message = MC.getCatalogedErrorMessage(catalogedError);
            expect(message.message).to.equal("This is an example message with positional inserts 1 2 3 4");
        });
    });

    describe('applyInserts', function () {
        it('replaces positional inserts', function () {
            var result = messageCatLib.internal.applyInserts("test {0}, {1}, {2}, {0}", {}, ["ONE", 2, "THREE"]);
            expect(result).to.equal("test ONE, 2, THREE, ONE");
        });
        it('replaces context inserts', function () {
            var result = messageCatLib.internal.applyInserts("test {id}, {0}", {id: "test-id"}, ["ONE"]);
            expect(result).to.equal("test test-id, ONE");
        });
        it('replaces context inserts where context is derived object', function () {
            var obj = {prop: "value"};
            var context = Object.create(obj);
            context.id = "test-id";
            var result = messageCatLib.internal.applyInserts("test {id}, {0}", context, ["ONE"]);
            expect(result).to.equal("test test-id, ONE");
        });
        it('replaces positional inserts when too many supplied', function () {
            var result = messageCatLib.internal.applyInserts("test {0}", {}, ["ONE", 2, "THREE"]);
            expect(result).to.equal("test ONE");
        });
        it('replaces positional inserts when too few supplied', function () {
            var result = messageCatLib.internal.applyInserts("test {0}, {1}", {}, ["ONE"]);
            expect(result).to.equal("test ONE, {1}");
        });
        it('replaces single positional insert with array', function () {
            var error = {"errorCode": "MY_ERROR", "fields":['A','B','C']};
            var insert = [JSON.stringify(error.fields)];
            var result = messageCatLib.internal.applyInserts("test: {0}", {}, insert);
            expect(result).to.equal('test: ["A","B","C"]');
        });
    });
});