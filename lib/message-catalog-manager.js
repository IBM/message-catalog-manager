/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: message-catalog-manager
 *   This project is licensed under the MIT License, see LICENSE
 */

'use strict';

var fileUrlRe = /^file:\/\//gi;
var remoteUrlRe = /^http:\/\//gi;
var _ = require('underscore');

//Message-Catalog-Manager class
var MessageCatalogManager = function (indexFilePath) {
    this.indexFilePath = indexFilePath;

    //Load the catalog-index object
    this.catalogIndex = require(this.indexFilePath);
    this.catalogRootPath = this.indexFilePath.substring(0, this.indexFilePath.lastIndexOf("/"));


    //Cache valid, local catalog files
    this.catalogList = {};
    this.cacheDone = false;
    for (var catalogName in this.catalogIndex) {
        /* istanbul ignore else */
        if (this.catalogIndex.hasOwnProperty(catalogName)) {
            var catalogIndexEntry = this.catalogIndex[catalogName];
            if (String(catalogIndexEntry.url).match(fileUrlRe)) {
                var filePath = catalogIndexEntry.url.substring(8);
                var catalogPath = this.catalogRootPath + filePath.substring(0, filePath.lastIndexOf("/") + 1);

                //Load all catalogs in cache
                var catalogs = require(catalogPath);
                var catalogNameLocale;
                for (var catalogLocale in catalogs) {
                    /* istanbul ignore else */
                    if (catalogs.hasOwnProperty(catalogLocale)) {
                        if (catalogLocale !== 'en') {
                            catalogNameLocale = catalogName + "-" + catalogLocale;
                        }
                        else {
                            catalogNameLocale = catalogName;
                        }
                        this.catalogList[catalogNameLocale] = catalogs[catalogLocale];
                    }
                }
            }
        }
    }
    this.cacheDone = true;
};

MessageCatalogManager.prototype.checkCatalog = function (catalogName) {
    var catalogIndexEntry = this.catalogIndex[catalogName];

    if (catalogIndexEntry === undefined) {
        throw new Error("Catalog " + catalogName + " not found");
    } else if (typeof catalogIndexEntry.url !== 'string') {
        throw new Error("Catalog Index Url not a string: " + catalogIndexEntry.url + " for catalog " + catalogName);
    } else if (catalogIndexEntry.url.match(fileUrlRe)) {
        return true;
    } else if (catalogIndexEntry.url.match(remoteUrlRe)) {
        throw new Error("Remote catalogs not yet supported for catalog " + catalogName);
    } else {
        throw new Error("Invalid Catalog Index Url");
    }
};

var isInsertTypeValid = function (insert) {
    return ["string", "number", "boolean", "object", "undefined"].indexOf(typeof insert) !== -1;
};

/**
 * Validate the value types in a map of named inserts
 * @param {[object<string, *>]} namedInserts - optional map of named inserts
 * @throws {Error} if type of an insert value is not supported
 */
var validateNamedInsertTypes = function (namedInserts){

    if (namedInserts !== undefined){
        if (typeof namedInserts !== 'object'){
            throw new Error("named inserts must be an object if defined");
        }
        for (var key in namedInserts){
            /* istanbul ignore else */
            if (namedInserts.hasOwnProperty(key)) {
                if (!isInsertTypeValid(namedInserts[key])) {
                    throw new Error("namedInserts '" + key + "' is of unsupported type " + typeof namedInserts[key]);
                }
            }
        }
    }
};

/**
 * Validate the value types in a map of positional inserts
 * @param {[*[]]} positionalInserts - optional array of positional inserts
 * @throws {Error} if type of an insert is not supported
 */
var validatePositionalInsertTypes = function (positionalInserts){
    if (positionalInserts !== undefined) {
        if (!Array.isArray(positionalInserts)) {
            throw new Error("positional inserts must be an array if defined");
        }
        for (var position = 0; position < positionalInserts.length; position++) {
            if (!isInsertTypeValid(positionalInserts[position])) {
                throw new Error("positionalInserts value with index: '" + position + "' is of unsupported type " + typeof positionalInserts[position]);
            }
        }
    }
};

var applyInserts = function (msg, namedInserts, positionalInserts) {
    var i;
    var re;

    //Replace positional inserts
    if (positionalInserts) {
        for (i = 0; i < positionalInserts.length; i++) {
            re = new RegExp("\\{" + i + "\\}", "gi");
            msg = msg.replace(re, positionalInserts[i]);
        }
    }

    //Replace key inserts
    for (var key in namedInserts) {
        if (namedInserts.hasOwnProperty(key)) {
            re = new RegExp("\\{" + key + "\\}", "gi");
            msg = msg.replace(re, namedInserts[key]);
        }
    }

    return msg;
};

MessageCatalogManager.prototype.getMessage = function (catalogName, code, namedInserts, positionalInserts, language, verbose) {

    this.checkCatalog(catalogName);
    var msg;
    //If the language wasn't provided or was english go for the default catalog
    if (language === undefined || language === "en") {
        msg = this.catalogList[catalogName][code];
    }
    //If a language was provided look for the locale catalog
    else {
        var catalogNameLocale = catalogName + "-" + language;
        if (this.catalogList[catalogNameLocale] !== undefined) {
            msg = this.catalogList[catalogNameLocale][code];
            //If the message was not found in the locale catalog look for it in the default one
            if (msg === undefined) {
                msg = this.catalogList[catalogName][code];
            }
        }
        else {
            msg = this.catalogList[catalogName][code];
        }
    }

    if (msg === undefined) {
        throw new Error("Message " + code + " not found in catalog " + catalogName);
    }

    //clone the message
    var message = JSON.parse(JSON.stringify(msg));

    validateNamedInsertTypes(namedInserts);
    validatePositionalInsertTypes(positionalInserts);

    if (message.namedInserts) {
        message.namedInserts = _.extend(namedInserts, message.namedInserts);
    }
    else {
        //if no catalog does not contain field, then create from incoming namedInserts object
        message.namedInserts = namedInserts;
    }

    if (message.message) {
        //apply Inserts to message
        message.message = applyInserts(message.message, namedInserts, positionalInserts);
    }
    else {
        throw new Error("Message " + code + " found in catalog " + catalogName + " but without message property");
    }
    if (message.action) {
        //apply Inserts to action
        message.action = applyInserts(message.action, namedInserts, positionalInserts);
    }
    if (message.detail) {
        //apply Inserts to detail
        message.detail = applyInserts(message.detail, namedInserts, positionalInserts);
    }

    if(!verbose) {
        delete message.namedInserts;
    }

    return message;

};

MessageCatalogManager.prototype.getCatalogedErrorMessage = function (catalogedError) {
    if (catalogedError.inserts !== undefined && catalogedError.positionalInserts === undefined)
    {
        //Tolerate V0 style catalogedError
        catalogedError.positionalInserts = catalogedError.inserts;
    }
    let messageCode = catalogedError.messageCode;
    if (catalogedError.messageNumber !== undefined){
        // support 'messageNumber' as the code for backward compatibility
        // this could be a plain JSON serialisation of a pre v2.1 message, where the getter is not available
        messageCode = catalogedError.messageNumber;
    }
    let msg = this.getMessage(catalogedError.catalog,messageCode,catalogedError.namedInserts,catalogedError.positionalInserts);

    return msg;
};


module.exports = {
    MessageCatalogManager: MessageCatalogManager,
    internal: {
        applyInserts: applyInserts,
        validateNamedInsertTypes: validateNamedInsertTypes,
        validatePositionalInsertTypes: validatePositionalInsertTypes
    }
};