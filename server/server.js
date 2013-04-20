/*global require,__dirname*/
var path = require('path');
var connect = require('connect');

var dir = path.join(__dirname, '..');

var app = connect();
app.use(connect.compress());
app.use(connect.static(dir));

connect.createServer(app).listen(8080);