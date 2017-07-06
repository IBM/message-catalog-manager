
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
    constructor(catalogIndex) {
        catalogManager = new MessageCatalogManager(catalogIndex);
        return this.middleware;
    }

    middleware(req, res, next) {
        var oldSend = res.send;

        res.send = function (data) {
            try {
                //If this has an error code and looks like a cataloged error then format it
                if ((res.statusCode >= 400 && res.statusCode <= 599) &&
                    data.messageNumber != undefined && data.catalog != undefined) {

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