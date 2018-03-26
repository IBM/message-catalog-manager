
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
     * @returns {function} - Express-compatible middleware function
     */
    constructor(catalogIndex, preProcessorFunction) {
        var self = this;
        catalogManager = new MessageCatalogManager(catalogIndex);
        return function(req,res,next) {
            return self._middleware(req, res, next, preProcessorFunction);
        };
    }

    _middleware(req, res, next, preProcessorFunction) {
        var oldSend = res.send;

        res.send = function (data) {
            try {
                //If this has an error code and looks like a cataloged error then format it
                if ((res.statusCode >= 400 && res.statusCode <= 599) &&
                    data.messageNumber != undefined && data.catalog != undefined) {

                    if(preProcessorFunction){
                        data = preProcessorFunction(data);
                    }
                    //Format
                    data = catalogManager.getCatalogedErrorMessage(data);
                }
            }
            catch (err) {
                res.status(500);
            }
            oldSend.call(this, data);
        };
        next();
    }
}

module.exports = CatalogedErrorFormatter;