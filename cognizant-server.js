var restify = require('restify');
var fs = require('fs');

var server = restify.createServer({
    name: 'cognizant',
    version: '0.0.1'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/echo/:name', function (req, res, next) {
    res.send(req.params);
    return next();
});

server.post('/images', function (req, res, next) {
    var stream = fs.createWriteStream('bob.jpg');
    req.pipe(stream);
    req.once('end', function () {
        console.log('srv: responding');
        res.send(204);
    });
    next();
});

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