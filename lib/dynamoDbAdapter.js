var AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';
AWS.config.output = 'json';
AWS.config.apiVersion = '2015-03-27';

var DynamoDbAdapter = function(){

};

DynamoDbAdapter.prototype.go = function(item){
    return item;
};

DynamoDbAdapter.prototype.putItem = function(filePath, callback){
    var s3 = new AWS.S3();
    var bucketList = [];
    var error = '';
    s3.listBuckets(function(err, data) {
        if (!err) {
            for (var index in data.Buckets) {
                var bucket = data.Buckets[index];
                bucketList.push({name: bucket.Name, created: bucket.CreationDate});
            }
        } else {
            error = err;
        }
        // Make sure the callback is a function​
        if (typeof callback === "function") {
            // Execute the callback function and pass the parameters to it​
            callback(error, bucketList);
        }
    });

};

module.exports = DynamoDbAdapter;