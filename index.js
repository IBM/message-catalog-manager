/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: message-catalog-manager
 *   This project is licensed under the MIT License, see LICENSE
 */
'use strict';

module.exports = {
    MessageCatalogManager: require('./lib/message-catalog-manager').MessageCatalogManager,
    CatalogedError: require('./lib/catalogedError.js'),
    formattingMiddleware: require('./lib/middleware/errorMiddleware.js'),
};
