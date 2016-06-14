var express = require('express');
var router = express.Router();
var mongo_api = require('../modules/mongo_api');
var db;
mongo_api.db_conn(function(getDB){//for pv

    db = getDB;
});

router.get('/iosactive', function(req, res, next){

    if(req.query.active_type==strong) {


        var doc = {}

        for (i in req.query) {
            doc[i] = req.query[i];

        }
        for (i in req.cookies) {
            doc[i] = req.cookies[i];

        }

        mongo_api.insertDocuments(db, 'iosactive', doc, function (err, r) {

            if (err) {

                res.send('not saved due to ' + err);
            } else {

                res.send('succeeded');
            }

        })
    }else if(req.query.active_type==weak){

        var appid = req.query.appid;
        var ip = req.ips[0];
        var doc_inner = {'app_id':appid, 'sip':ip};
        var doc = {'all_info':{$elemMatch:doc_inner}};
        var collection = db.collection('yushan_user');
        collection.find(doc).toArray(function(err, docs){
                if(docs.length==0){
                    res.send('no match');
                }else{
                    var alt_ys_uuid = [];
                    req.query.ys_uuid=docs[0].ys_uuid;//make first match as ys_uuid
                    for(var item in docs.shift()){
                        alt_ys_uuid.push(item.ys_uuid);
                    }

                    req.query.alt_ys_uuid = alt_ys_uuid;//save other matched ys_uuid
                    var co_ios = db.collection('iosactive');
                    co_ios.insertOne(req.query, function(err, data){
                        if(err){
                            console.log(err);
                        }
                    })

                }

            })

        }


})


router.get('/iossacheck', function(req, res, next){

    var collection = db.collection('iosactive');
    var doc = {appid:appid, idfa:idfa};


    collection.find(doc).limit(1).toArray(function(err, docs){

        if(err){
            res.send('internal error');
        }else{
            if(docs.length==1){
                res.send('data record');

            }else{//no such record since iosactive request issue

                res.send('no record');

            }

        }
    })


})


router.get('/geth', function(req, res, next){

    console.log(req);
    res.end('66666');


})

module.exports = router;
