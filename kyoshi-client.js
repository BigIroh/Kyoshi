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