(function() {
    "use strict";
    /*global console,require,__dirname*/

    var path = require('path');
    var express = require('express');

    var mime = express.mime;
    mime.define({
        'application/json' : ['czml']
    });

    var url = require('url');
    var request = require('request');

    var Q = require('q');

    var dir = path.join(__dirname, '..');

    var app = express();
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

    app.get('/proxy', function(req, res) {
        var remoteUrl = Object.keys(req.query)[0];
        if (url.parse(remoteUrl).hostname !== 'images.earthkam.ucsd.edu') {
            res.end();
        }

        request.get(remoteUrl).pipe(res);
    });

    app.get('/rows', function(req, res) {
        return getDatabase().then(function(db) {
            return Q.nfcall(db.list);
        }).then(function(body) {
            res.send(body[0].rows.join(','));
        }).done();
    });

    app.listen(8080);
})();