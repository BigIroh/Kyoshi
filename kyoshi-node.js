var listen = function (app, contentPath) {
    var listeners = app.listeners('request').splice(0);
    app.removeAllListeners('request');
    app.on('request', function (req, res) {
        if (req.url == '/kyoshi.js') {
            var stream = require('fs').createReadStream('kyoshi-client.js');
            stream.on('data', function (chunk) {
                res.write(chunk);
            });
            stream.on('end', function () {
                res.end();
            });
            return;
        }
        listeners.forEach(function (listener) {
            listener.call(app, req, res);
        });
    });
    var io = require('socket.io').listen(app, {log: false});
    io.sockets.on('connection', function (socket) {
        socket.on('__init', function (filename) {
            socket.join(filename);
            if(filename.match(/^.+\.js$/)) {
                try {
                    var module = require('./'+require('path').join(contentPath,filename));
                    var exports = Object.getOwnPropertyNames(module);
                    module.sockets = function () {
                        return io.sockets.in(filename);
                    };
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