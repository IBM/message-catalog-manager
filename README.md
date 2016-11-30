# message-catalog
[![Build Status](https://travis-ci.org/IBM/message-catalog-manager.svg)](https://travis-ci.org/IBM/message-catalog-manager)
[![Coverage Status](https://coveralls.io/repos/github/IBM/message-catalog-manager/badge.svg?branch=master)](https://coveralls.io/github/IBM/message-catalog-manager?branch=master)

## Overview
Support for message catalogs, including:
- catalog index
- remote and local catalogs
- message lookup from a catalog
- NLS bundles
- message inserts
- catloggedError class that carries catalog message context information

### Catalog file format
The catalog manager works with a set of json message catalog files contain message text.  
These are indexed in a separate catalog index file which is provided to the catalog manager.  

For an example of the catalog file format see:  
[messages.json](test/catalogs/example/messages.json)  
For an example of the catalog index fileformat see:  
[catalog-index.json](test/catalogs/example/index.js)  

### Using messageCatalogManager
var MessageCatalogManager = require("message-catalog").messageCatalogManager;
var catalogManager = new MessageCatalogManager("/catalog-index.json");
var formattedMessage = catalogManager.getMessage("catalog1", "0001", {}, ["myapp"]);

### Using catalogedError
var CatalogedError = require("message-catalog").catalogedError;
var throw new CatalogedError("0001", "An error occurred", ["myapp"], "catalog1");
