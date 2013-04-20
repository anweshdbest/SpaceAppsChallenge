(function() {
    "use strict";
    /*global console,require,__dirname*/
    var path = require('path');
    var express = require('express');
    var Q = require('q');
    var app = express();

    var dir = path.join(__dirname, '..');

    app.use(express.compress());
    app.use(express.static(dir));

    var nano = require('nano')('http://localhost:5984');

    function getDatabase() {
        var name = 'space_apps';

        return Q.nfcall(nano.db.get, name).then(function() {
            return nano.use(name);
        }, function(error) {
            return Q.nfcall(nano.db.create, name).then(function() {
                return nano.use(name);
            }, function(error) {
                console.log(error);
            });
        });
    }

    app.get('/rows', function(req, res) {
        return getDatabase().then(function(db) {
            return Q.nfcall(db.list);
        }).then(function(body) {
            res.send(body[0].rows.join(','));
        }).done();
    });

    app.listen(8080);
})();