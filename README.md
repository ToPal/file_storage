# Key-value file storage
File storage module for Node.js for key-value data

# Using
Example:
```javascript
var Storage = require('file_storage');
var storage = new Storage('users.json', {
  savePeriod: 5, // in seconds
  pretty: true   // with 'pretty' data will write to file with indentions
}, function (err, data) {
  // this callback is not required
})

//...

storage.data['user1'] = someObject;
storage.data.user2 = anotherObject;
```
## Constructor arguments
### fileName
Required argument. Path to file where the data will be stored

### options
Optional argument. May contains next options:
- *savePeriod*. Time interval in seconds. Data saves in file every savePeriod seconds. Default: 10
- *pretty*. If option the specified and equal 'true', data will save to file with indentions
- *log*. For specifing non-standart logger.

### callback
Optional argument. Function which calls when the file_storage instance created and loaded data from file

## Methods
### stop()
Stops the save to file demon.

### save(cb)
Saves data to file. It is not recommened to use this method if the Storage is not stopped. Returned an error object to callback.
