/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: message-catalog-manager
 *   This project is licensed under the MIT License, see LICENSE
 */

'use strict';

var messageCatalogManager = require("./message-catalog-manager.js");

class CatalogedError extends Error {

    /**
     * Construct a catalogedError
     * @param {string}   messageCode - message's identifier in the catalog
     * @param {string}   catalog - catalog containing message
     * @param {string}   message - debug message text
     * @param {[object<string,*>]} namedInserts - optional map of named message inserts
     * @param {[*[]]}    positionalInserts - optional array of positional message inserts
     */
    constructor(messageCode, catalog, message, namedInserts, positionalInserts) {

        messageCatalogManager.internal.validateNamedInsertTypes(namedInserts);
        messageCatalogManager.internal.validatePositionalInsertTypes(positionalInserts);

        super(message);
        this.messageCode = messageCode || "DEFAULT";
        this.catalog = catalog || "DEFAULT";
        this.namedInserts = namedInserts || {};
        this.positionalInserts = positionalInserts || [];
    }

    /**
     * @deprecated For pre v2.1 compatibility only
     *             Please use `messageCode` instead to get the message's unique identifier
     * @returns {string} - message code
     */
    get messageNumber() {
        return this.messageCode;
    }

    /**
     * Returns true if an object is a cataloged error
     * @param {Object} object - object to check
     * @returns {boolean} - is a cataloged error
     */
    static isCatalogedError (object) {
        return (
            (object instanceof Object) &&
            (object.messageNumber !== undefined || object.messageCode !== undefined) && // support JSON serialised pre v2.1, which has a `messageNumber` instead of `messageCode`
            (object.catalog !== undefined)
        );
    }
}

module.exports = CatalogedError;
