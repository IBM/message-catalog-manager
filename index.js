/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: message-catalog-manager
 *   This project is licensed under the MIT License, see LICENSE
 */
'use strict';

module.exports = {
    messageCatalogManager: require('./lib/message-catalog-manager').MessageCatalogManager,
    catalogedError: require('./lib/catalogedError.js'),
    errorFormattingMiddleware: require('./lib/middleware/errorMiddleware.js'),
};
