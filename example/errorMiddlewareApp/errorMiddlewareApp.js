
/*
 * Licensed Materials - Property of IBM
 * (C) Copyright IBM Corp. 2017, 2017. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

'use strict';

let express = require('express');
let app = express();
let messageCatalogManager = require('../../index.js');

const insertTransformer = (data) => {
    return new Promise((resolve) => {
        //Transform key inserts
        for (let key in data.namedInserts) {
            if (data.namedInserts.hasOwnProperty(key)) {
                switch (typeof data.namedInserts[key]) {
                    //Upper case strings
                    case 'string':
                        data.namedInserts[key] = data.namedInserts[key].toUpperCase();
                        break;
                    //Toggle booleans
                    case 'boolean':
                        data.namedInserts[key] = !data.namedInserts[key];
                        break;
                    //Double numbers
                    case 'number':
                        data.namedInserts[key] = data.namedInserts[key] * 2;
                        break;
                }
            }
        }
        resolve(data);
    });
};

app.use(messageCatalogManager.formattingMiddleware(__dirname + '/../../test/catalog-index.json', insertTransformer));

app.get('/*', function (req, res) {
    let exampleError = new messageCatalogManager.CatalogedError('0002', 'exampleLocal', 'Example error', { id: "example id", number: 123, boolean: false }, []);
    res.status(400).send(exampleError);
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});