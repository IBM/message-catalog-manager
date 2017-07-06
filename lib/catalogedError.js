/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: message-catalog-manager
 *   This project is licensed under the MIT License, see LICENSE
 */

'use strict';

class catalogedError extends Error {
    constructor(messageNumber, catalog, message, namedInserts, positionalInserts) {
        super(message);
        this.messageNumber = messageNumber || "DEFAULT";
        this.catalog = catalog || "DEFAULT";
        this.namedInserts = namedInserts || {};
        this.positionalInserts = positionalInserts || [];
    }
}

module.exports = catalogedError;
