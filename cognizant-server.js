var restify = require('restify');
var fs = require('fs');
var bunyan = require('bunyan');

var log = bunyan.createLogger({
    name: 'app_log',
    streams: [{
        type: 'rotating-file',
        path: __dirname + '/logs/app.log',
        period: '1d',   // daily rotation
        count: 3        // keep 3 back copies
    }]
});

var app_path = __dirname;
var config_path = app_path + "/config/config.json";
var appConfig = JSON.parse(fs.readFileSync(config_path, 'utf8'));

var server = restify.createServer({
    name: appConfig.serverName,
    version: appConfig.serverVersion
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.on('uncaughtException', function (req, res, route, err) {
    log.error(err);
    res.send(500, {"error": {"code": 500, "message": err.message}});

});

server.get('/echo/:name', function (req, res, next) {
    res.send(req.params);
    return next();
});

server.post('/snapshots/images/:fileName', function (req, res, next) {
    log.info("POST Request from: " + req);
    if(req.is('application/octet-stream')) {
        log.info("Content-Type: application/octet-stream seen, treating this as a chunked upload");
        var targetFilePath = __dirname + '/' + appConfig.imageLocalPath + '/' + req.params.fileName;
        var stream = fs.createWriteStream(targetFilePath);
        req.pipe(stream);
        req.once('end', function () {
            log.info("Finished streaming file to disk at: " + targetFilePath);
            res.send(204);
        });
    } else {
        log.info("Treating this as a NON-chunked normal file upload");
        if(!req.files.image) {
            log.error("File payload not seen under form key: 'image'");
            res.send(400);
        }
        fs.readFile(req.files.image.path, function (err, data) {
            if(err) log.error("Error reading chunked file: " + err);
            var imageName = req.files.image.name
            /// If there's an error
            if(!imageName){
                log.error("file name not found withing the 'image' label.  Aborting");
                console.log("There was an error")
                res.redirect("/");
                res.end();
            } else {
                var newPath = __dirname + '/' + appConfig.imageLocalPath + '/' + req.params.fileName;
                /// write file to uploads/fullsize folder
                fs.writeFile(newPath, data, function (err) {
                    if(err) log.error("Error writing file to new path " + newPath + "  Error was: " + err);
                    res.send(204);
                });
            }
        });
    }
    next();
});

server.get(/\/snapshots\/images\/.*/, restify.serveStatic({
    directory: __dirname,
    maxAge: 3600 //Cache-Control: sec
}));

server.get('/s3-buckets', function (req, res, next) {
    var DynamoDbAdapter = require('./lib/dynamoDbAdapter.js');
    var dynamoDbAdapter = new DynamoDbAdapter();
    dynamoDbAdapter.putItem('boom', function (err, data) {
        if (err) {
            res.send({error: err});
        } else {
            res.send({buckets: data});
        }
    });
    return next();
});

server.listen(8777, function () {
    console.log('%s listening at %s', server.name, server.url);
});