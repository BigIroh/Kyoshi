Kyoshi
======

Kyoshi is an abstraction on Socket.io that allows Javascript in the browser to access files written for Node.js.

##How to use
###Setup
```javascript
  require('kyoshi').listen(app, path);
```
Kyoshi attaches to your http object just like Socket.io does. `app` is your http server. `path` is the path to your server-side javascript files.
###Server Side
```javascript
  var userCount = 0;

  exports.users = function(callback) {
    callback(userCount);
  }
  
  exports.log = function(message) {
    console.log(message);
  }
  
  exports.connect = function(id) {
    userCount++;
  }
  
  exports.disconnect = function(id) {
    userCount--;
  }
```
Any function exposed on the `exports` object is accessable to the client. The `connect` and `disconnect` functions are used by kyoshi to tell the file when someone connects and disconnects from the file. They both take an id. This is the unique id for the connection.
###Client Side
```html
  <html>
    <head>
      <script src="/socket.io/socket.io.js"></script>
      <script src="/kyoshi.js"></script>
      <script type="text/javascript">
        kyoshi('example.js', function(exports){
          exports.users(function(users) {
            console.log('There are '+users+' viewing this page!');
          });
          exports.log('hello from connection '+exports.id);
        });
      </script>
    </head>
  </html>
```
In this example, the page is referencing `example.js` from earlier. The client javascript is able to call any functions on the `exports` object built serverside.
