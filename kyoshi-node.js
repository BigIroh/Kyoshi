/*
 * Copyright (c) 2013 Matthew Scandalis
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

//Kyoshi-node.js
var path = require('path');
var listen = function (app, contentPath) {
    //Adds a listener at the begining of the listener list to intercept the request to '/kyoshi.js' and serve up its version.
    var listeners = app.listeners('request').splice(0);
    app.removeAllListeners('request');
    app.on('request', function (req, res) {
        if (req.url == '/kyoshi.js') {
            var stream = require('fs').createReadStream(path.join(path.dirname(module.filename),'kyoshi-client.js'));
            stream.on('data', function (chunk) {
                res.write(chunk);
            });
            stream.on('end', function () {
                res.end();
            });
        }
    });
    listeners.forEach(function (listener) {
        app.on('request', listener);
    });
    //Start the websocket listener
    var io = require('socket.io').listen(app, {log: false});
    io.sockets.on('connection', function (socket) {
        //wait for the initial connection
        socket.on('__init', function (filename) {
            //join a room corresponding to the file
            socket.join(filename);
            if(filename.match(/^.+\.js$/)) {
                try {
                    //load the user's js file as a module so its preserved in the cache
                    var module = require(path.join(process.cwd(),contentPath,filename));
                    var exports = Object.getOwnPropertyNames(module);
                    //give it access to sockets accessing the file
                    module.sockets = function () {
                        return io.sockets.in(filename);
                    };
                    //build the function to catch the messages from the client and handle the function calls
                    exports.forEach(function (value) {
                        socket.on(filename+value, function (args) {
                            var params = [];
                            for (i in args) {
                                params.push(args[i]);
                            }
                            params.forEach(function (arg, index) {
                                if (arg.type == 'function') {
                                    params[index] = function () {
                                        socket.emit(arg.id, Array.prototype.slice.call(arguments));
                                    }
                                }
                                else {
                                    params[index] = arg.value;
                                }
                            });
                            module[value].apply(module, params);
                        });
                    });
                    if (module.connect) module.connect(socket.id);
                    if (module.disconnect) socket.on('disconnect', function () {
                        module.disconnect(socket.id);
                    });
                    socket.emit('__init', null, exports, socket.id);
                }
                catch (e) {
                    socket.emit('__init', e, null);
                }
            }
            else {
                socket.emit('__init', 'You can only use Kyoshi.js on .js files!', null);
            }
        });
    });
}
exports.listen = listen;