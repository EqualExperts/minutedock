var MongoClient = require('mongodb').MongoClient;
var Q = require('q');
var crypto = require('crypto');
var uuid = require('uuid');

var config = require('config');
var globalSalt = config["apikey.encryption.global.salt"];

MongoClient.connect(config["mongodb.uri"], {useNewUrlParser:true},function(err, db) {
    if(err) throw err;
    var collection = db.db(config['mongodb.db']).collection("users");

    collection.ensureIndex("identifier",{unique : true} ,function(err, indexName) {
      if(!err)
	     console.log("created index: " + indexName);
       else{
        throw err;
       }      
    });

	exports.addUser = function(identifier, apiKey, accountId) {
    var recordSalt = uuid.v4();
    var cipher = crypto.createCipher('aes-256-cbc', globalSalt + recordSalt);
    var encryptedApiKey = cipher.update(apiKey, 'utf8', 'base64');
    encryptedApiKey += cipher.final('base64');
		var document = {identifier : identifier, apiKey : encryptedApiKey, accountId: accountId, recordSalt : recordSalt, date : new Date()};
        collection.update({identifier : identifier}, document, {upsert:true}, function(err, records) {
			if(err) throw err;
		});		
	};  

  exports.deleteUsers = function(identifier) {
    collection.remove({identifier : identifier},function(err) {
      if(err) throw err;
    });
  };  
  
	exports.findUser= function(identifier, callback) {
    var deferred = Q.defer();
		collection.findOne({identifier : identifier}).then(function(doc) {
      if(doc){
        var decipher = crypto.createDecipher('aes-256-cbc', globalSalt + doc.recordSalt);
        var apiKey = decipher.update(doc.apiKey, 'base64','utf8');
        apiKey += decipher.final('utf8');
        doc.apiKey = apiKey;
      	deferred.resolve(doc);                          	
      }
      else{
      	deferred.reject();
      }
    });
    return deferred.promise;
	};

});