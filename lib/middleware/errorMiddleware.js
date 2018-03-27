/*
 * Licensed Materials - Property of IBM
 * (C) Copyright IBM Corp. 2017, 2017. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

'use strict';
let MessageCatalogManager = require('../message-catalog-manager.js').MessageCatalogManager;
let catalogManager;

class CatalogedErrorFormatter {

    /**
     * Construct a middleware function to format instances of CatalogedMessage
     * @param {string} catalogIndex - path to message catalog file
     * @param {function} [preProcessorFunction] - optional function to transform a message before formatting it
     *                                            the function can return either a {CatalogedError}, or a {Promise<CatalogedError>}
     * @returns {function} - Express-compatible middleware function
     */
    constructor(catalogIndex, preProcessorFunction) {
        var self = this;
        catalogManager = new MessageCatalogManager(catalogIndex);
        return function (req, res, next) {
            return self._middleware(req, res, next, preProcessorFunction);
        };
    }

    _middleware(req, res, next, preProcessorFunction) {
        var oldSend = res.send;

        res.send = function (data) {
            try {
                //If this has an error code and looks like a cataloged error then format it
                if ((res.statusCode >= 400 && res.statusCode <= 599) &&
                    data.messageNumber !== undefined && data.catalog !== undefined) {

                    // run pre-processor function if one was given
                    if (preProcessorFunction) {
                        var transformedData = preProcessorFunction(data);
                        if (typeof transformedData.then === 'function') {
                            // transformed data is then'able, treat as promise-to-data
                            return transformedData
                                .then(function (transformedData) {
                                    var formattedData = catalogManager.getCatalogedErrorMessage(transformedData);
                                    oldSend.call(this, formattedData);
                                })
                                .catch(function (){
                                    // transformation has failed, send HTTP500 with unformatted original message
                                    res.status(500);
                                    oldSend.call(this, JSON.stringify(data));
                                });
                        }
                        else {
                            // transformed data is not a promise, use directly
                            data = transformedData;
                        }
                    }

                    //Format
                    data = catalogManager.getCatalogedErrorMessage(data);
                }
            }
            catch (err) {
                res.status(500);
                data = JSON.stringify(data);
            }
            oldSend.call(this, data);
        };
        next();
    }
}

module.exports = CatalogedErrorFormatter;