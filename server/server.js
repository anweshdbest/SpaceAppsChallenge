/*global require,__dirname*/
var path = require('path');
var connect = require('connect');

var dir = path.join(__dirname, '..');

connect.createServer(connect.static(dir)).listen(8080);