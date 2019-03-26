var MongoClient = require('mongodb').MongoClient;
var Q = require('q');
var crypto = require('crypto');
var moment = require('moment');
require('moment-isoduration');

var config = require('config');
var globalSalt = config["identifier.encryption.global.salt"];

MongoClient.connect(config["mongodb.uri"], {useNewUrlParser:true}, function(err, db) {
    if (err) throw err;
    var collection = db.db(config['mongodb.db']).collection("authtokens");

    collection.ensureIndex("authToken", {unique: true}, function (err, indexName) {
        if (!err)
            console.log("created index: " + indexName);
        else {
            throw err;
        }
    });

    var ttlDurationInISO = config["authToken.ttl"];
    var ttlDuration = moment.duration.fromIsoduration(ttlDurationInISO).asSeconds();
    collection.ensureIndex({"date": 1}, {expireAfterSeconds: ttlDuration}, function (err, indexName) {
        if (!err)
            console.log("created index: " + indexName);
        else {
            throw err;
        }
    });

    exports.addAuthToken = function (authToken, identifier) {
        var sha256 = crypto.createHash('sha256');
        sha256.update(globalSalt + identifier);
        var hashedIdentifier = sha256.digest('hex');
        var document = {authToken: authToken, identifier: hashedIdentifier, date: new Date()};
        collection.insertOne(document, function (err, records) {
            if (err) throw err;
        });
    };

    exports.removeAuthToken = function (authToken) {
        collection.removeOne({authToken: authToken}, function (err) {
            if (err) throw err;
        });
    };

    exports.findIdentifier = function (authToken) {
        var deferred = Q.defer();
        collection.findOne({authToken: authToken}).then(function (doc) {
            if (doc) {
                deferred.resolve(doc.identifier);
            }
            else {
                deferred.reject();
            }
        });
        return deferred.promise;
    };

});