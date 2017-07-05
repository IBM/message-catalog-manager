
/*
 * Licensed Materials - Property of IBM
 * (C) Copyright IBM Corp. 2017, 2017. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

'use strict';

let express = require('express');
let app = express();
let CatalogedError = require('../../index.js').catalogedError;
let CatalogedErrorFormatter = require('../../index.js').catalogedErrorFormatter;

app.use(new CatalogedErrorFormatter(__dirname + '/../../test/catalog-index.json'));

app.get('/*', function (req, res) {
    let exampleError = new CatalogedError('0002','exampleLocal','Example error',[],{id:"EXAMPLE ID"});
    res.status(400).send(exampleError);
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});