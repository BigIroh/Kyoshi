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

//Kyoshi-client.js

var kyoshi = function () {
    var socket = io.connect(location.protocol+'//'+location.hostname);
    var id = 0;
    return function (file, callback) {
        socket.once('__init', function(err, options, connId) {
            if(err) {
                console.log(err);
                return;
            }
            var exports = {};
            exports.id = connId;
            exports.on = function(name, callback) {
                socket.on(name, callback);
            }
            options.forEach(function (i) {
                exports[i] = function () {
                    var params = {};
                    Array.prototype.slice.call(arguments).forEach(function (argument, j) {
                        if(typeof argument === 'function') {
                            params[j] = {
                                type: 'function',
                                id: id 
                            };
                            socket.on(id, function(data) {
                                argument.apply(null, data);
                            });
                            id++;
                        }
                        else {
                            params[j] = {
                                type: 'param',
                                value: argument
                            }
                        }
                    });
                    socket.emit(file+i, params);
                };
            });
            callback(exports);
        })
        socket.emit('__init', file);
    }
}();