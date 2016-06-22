var MongoClient = require('mongodb').MongoClient;
var ObjectId=require('mongodb').ObjectId;
var util = require('util');
var settings = require('../settings');
var pv_monitor = require('./pv_issue_monitor');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
//new connection to ali mongo db



// Connection URL - old one
// var url = 'mongodb://123.57.42.84:27017/yushan';
//var url = 'mongodb://%s:%s@%s:%s/%s';
//url = util.format(url, settings.mongo_user, settings.mongo_passwd, settings.mongo_server, settings.mongo_port, settings.mongo_db);


// Use connect method to connect to the Server


var get_objID = function(objid){


    return new ObjectID(objid);
}

var db_conn = function(callback){



    var url = util.format('mongodb://%s:%s@%s/%s?%s', settings.mongo_user, settings.mongo_passwd, settings.mongo_server, settings.mongo_db, settings.moptions);


    console.log(url);



    MongoClient.connect(url, function(err, db) {
        if(err){

            pv_monitor.send_issue('YUSHAN *MONGODB CONNECTION* ISSUE', err.toString(), 'admin', function(body){

                console.log('YUSHAN *MONGODB CONNECTION* ISSUE '+err);


            });
            callback(db);

        }
        else {


            console.log("Connected correctly to server");
            callback(db);
        }
    });

};

var inner_conn_instance = function(callback){

    db_conn(callback);


}


var insertDocuments = function(db, collection, doc, callback) {
    // Get the documents collection

    if(db) {


        var collection = db.collection(collection);
        collection.insertOne(doc, function(err, data){
            if(err){
                pv_monitor.send_issue('YUSHAN *MONGODB DATA INSERT* ISSUE ', err.toString(), 'admin', function(body){


                    console.log('YUSHAN *MONGODB DATA INSERT* ISSUE '+err);


                });
                callback(err);//fail

            }else{
                callback(null);//success
            }

        });

    }

};

var updateD = function(db, collection, filter, update, callback){

    if(db) {


        var collection = db.collection(collection);
        collection.updateOne(filter, update, function(err, data){
            if(err){
                pv_monitor.send_issue('YUSHAN *MONGODB DATA updateD* ISSUE ', err.toString(), 'admin', function(body){


                    console.log('YUSHAN *MONGODB DATA updateD* ISSUE '+err);


                });
                callback(err);//fail

            }else{
                callback(null);//success
            }

        });

    }




}


var findOne = function(db, collection, doc, callback) {

    var collection = db.collection(collection);

    collection.find(doc).limit(1).next(callback);
}


var findMany = function(db, collection, doc, num, callback) {//for qtfm only

    var collection = db.collection(collection);

    collection.find(doc,{s1:1, s2:1, name:1, desc:1, img_url:1}).limit(num).toArray(callback);
}




var f1update = function(db, collection, filter, update, callback){

    var collection = db.collection(collection);

    collection.findOneAndUpdate(filter, update, {returnOriginal:false}, callback);

}


var updateUT = function(db, collection, doc, pvs, callback){

    if(db) {

        async.waterfall([
            function (callback) {//find out yushan user with ys_uuid

                findOne(db, collection, doc, function (err, data) {

                    if (!data) {//no data

                        err = 'no such user';
                        callback(err)
                    } else {
                        callback(err, {_id: new ObjectId(data._id)}, data.qt);
                    }

                })

            }, function (filter, qt, callback) {//update yushan user

                var updateDoc = util.format('{"all_info.%s.pvtrace":%s}', qt, pvs);
              //  console.log(updateDoc);
                try{

                    updateDoc = JSON.parse(updateDoc);
                    f1update(db, collection, filter, {$push: updateDoc}, function (err, data) {
                        callback(err, data);
                    })

                }catch(err){
                    console.log(updateDoc);
                    console.log('pvs-'+pvs);
                    callback(err);

                }

            }
        ], function (err, data) {
            callback(err, data);

        })


    }

}

var updateDL = function(db, collection, doc, callback) {

    async.waterfall([
        function (callback) {//find out yushan user with ys_uuid

            findOne(db, collection, doc, function (err, data) {

                if (!data) {//no data

                    err = 'no such user';
                    callback(err)
                } else {
                    callback(err, {_id: new ObjectId(data._id)}, data.qt);
                }

            })

        }, function (filter, qt, callback) {//update yushan user

            var updateDoc = util.format('{"all_info.%s.dlflag":%s}', qt, 1);

            updateDoc = JSON.parse(updateDoc);

            //console.log(updateDoc);

            f1update(db, collection, filter, {$set: updateDoc}, function (err, data) {

                //console.log(data);
                callback(err, data);
            })

        }
    ], function (err, data) {
        callback(err, data);

    })
}

//test only


//var db_instance;
//
//db_conn(function(getDB){
//
//    db_instance = getDB;
//    console.log(db_instance);
//});
exports.updateDL = updateDL;
exports.f1update = f1update;
exports.updateUT = updateUT;
exports.updateD = updateD;
exports.findOne = findOne;
exports.findMany = findMany;
exports.insertDocuments = insertDocuments;
exports.db_conn = db_conn;
exports.inner_conn_instance = inner_conn_instance;
exports.get_objID = get_objID;