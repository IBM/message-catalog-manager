# message-catalog-manager
[![Build Status](https://travis-ci.org/IBM/message-catalog-manager.svg)](https://travis-ci.org/IBM/message-catalog-manager)
[![Coverage Status](https://coveralls.io/repos/github/IBM/message-catalog-manager/badge.svg?branch=master)](https://coveralls.io/github/IBM/message-catalog-manager?branch=master)

## Overview

This module provides a mechanism for translating messages to provide user readable information. Messages support named and positional inserts to give context to the messages. Messages can include messages and actions, as well as urls for more information. A catloggedError class carries catalog message context information so errors thrown around a system can be translated at the appropriate point.

### Catalog file format
The catalog manager works with a set of json message catalog files contain message text.
These are indexed in a separate catalog index file which is provided to the catalog manager.

For an example of the catalog file format see:
[messages.json](test/catalogs/example/messages.json)
For an example of the catalog index file format see:
[catalog-index.json](test/catalogs/example/index.js)

### Using message-catalog-manager
```js
var MessageCatalogManager = require("message-catalog-manager").MessageCatalogManager;
var catalogManager = new MessageCatalogManager("/catalog-index.json");
var formattedMessage = catalogManager.getMessage("catalog1", "0001", {}, ["myapp"]);
```

### Using catalogedError
```js
var CatalogedError = require("message-catalog").CatalogedError;
throw new CatalogedError("0001", "catalog1", "An error occurred", ["myapp"]);
```

## Express Middleware

If your Express application generates or receives a `CatalogedError` you can use the `formattingMiddleware` middleware to intercept all responses and attempt to format error responses before they are sent.

```js
app.use(new ErrorFormattingMiddleware('catalog-index.json'));
```

There is a simple application that always responds with a `CatalogedError` in [example](/example). Start it like
```
node example/errorMiddlewareApp/errorMiddlewareApp.js
```

## Release Notes

**v1.0.0**

- Initial release

**v2.0.0**

- Positional and named inserts can now be of type: undefined and object, in addition to string, number, boolean
  Objects and arrays will be stringified with the normal `toString()`
- `catalogedError` constructor will throw for unsupported insert types

**v2.1.0**

- Classes `MessageCatalogManager` and `CatalogedError` are exported with a capitalised class names
- The message identifier for a `CatalogedError` instance renamed `messageCode` instead of `messageNumber` (it's type is string)
- formattingMiddleware should be called as a function (not with `new`)
- formattingMiddleware supports an optional function to transform messages before formatting:
    ```js
    function myTransform(msg){
      // transform msg as required
      return msg;
    }
    app.use(messageCatalogManager.formattingMiddleware('catalog-index.json', myTransform));
    ```
  The function can be synchronous (return a transformed message object) or asynchronous (return a promise to a
  transformed message object)
