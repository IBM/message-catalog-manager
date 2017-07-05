/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: message-catalog-manager
 *   This project is licensed under the MIT License, see LICENSE
 */

'use strict';

class catalogedError extends Error {
    constructor(messageNumber, catalog, message, inserts, namedInserts) {
        super(message);
        this.messageNumber = messageNumber || "DEFAULT";
        this.inserts = inserts || [];
        this.catalog = catalog || "DEFAULT";
        this.namedInserts = namedInserts || {};
    }
}

module.exports = catalogedError;
