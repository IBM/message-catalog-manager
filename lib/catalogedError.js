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
     * @param {string}   messageNumber - message code
     * @param {string}   catalog - catalog containing message
     * @param {string}   message - debug message text
     * @param {[object<string,*>]} namedInserts - optional map of named message inserts
     * @param {[*[]]}    positionalInserts - optional array of positional message inserts
     */
    constructor(messageNumber, catalog, message, namedInserts, positionalInserts) {

        messageCatalogManager.internal.validateNamedInsertTypes(namedInserts);
        messageCatalogManager.internal.validatePositionalInsertTypes(positionalInserts);

        super(message);
        this.messageNumber = messageNumber || "DEFAULT";
        this.catalog = catalog || "DEFAULT";
        this.namedInserts = namedInserts || {};
        this.positionalInserts = positionalInserts || [];
    }
}

module.exports = CatalogedError;
