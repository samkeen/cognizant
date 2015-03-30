var restify = require('restify');
var fs = require('fs');

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

server.get('/echo/:name', function (req, res, next) {
    res.send(req.params);
    return next();
});

server.post('/snapshots/images/:fileName', function (req, res, next) {
    var stream = fs.createWriteStream(appConfig.imageLocalPath + '/' + req.params.fileName);
    req.pipe(stream);
    req.once('end', function () {
        console.log('srv: responding');
        res.send(204);
    });
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