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

var applyInserts = function (msg, namedInserts, posInserts) {
    var i;
    var re;
    //Replace positional inserts
    for (i = 0; i < posInserts.length; i++) {
        re = new RegExp("\\{" + i + "\\}", "gi");
        msg = msg.replace(re, posInserts[i]);
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

MessageCatalogManager.prototype.getMessage = function (catalogName, code, namedInserts, posInserts, language, verbose) {

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

    for (var key in namedInserts){
        /* istanbul ignore else */
        if (namedInserts.hasOwnProperty(key)) {
            if (typeof namedInserts[key] !== "string") {
                throw new Error("namedInserts value: '" + key + "' must be of type string");
            }
        }
    }

    if (message.namedInserts) {
        message.namedInserts = _.extend(namedInserts, message.namedInserts);
    }
    else {
        //if no catalog does not contain field, then create from incoming namedInserts object
        message.namedInserts = namedInserts;
    }

    if (message.message) {
        //apply Inserts to message
        message.message = applyInserts(message.message, namedInserts, posInserts);
    }
    else {
        throw new Error("Message " + code + " found in catalog " + catalogName + " but without message property");
    }
    if (message.action) {
        //apply Inserts to action
        message.action = applyInserts(message.action, namedInserts, posInserts);
    }
    if (message.detail) {
        //apply Inserts to detail
        message.detail = applyInserts(message.detail, namedInserts, posInserts);
    }

    if(!verbose) {
        delete message.namedInserts;
    }

    return message;

};

MessageCatalogManager.prototype.getCatalogedErrorMessage = function (catalogedError) {
    var msg = this.getMessage(catalogedError.catalog,catalogedError.messageNumber,catalogedError.namedInserts,catalogedError.inserts);

    return msg;
};


module.exports = {
    MessageCatalogManager: MessageCatalogManager,
    internal: {
        applyInserts: applyInserts
    }
};