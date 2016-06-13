var express = require('express');
var router = express.Router();
var mongo_api = require('../modules/mongo_api');
var db;
mongo_api.db_conn(function(getDB){//for pv

    db = getDB;
});

router.get('/iosactive', function(req, res, next){



    var doc = {}

    for (i in req.query){
        doc[i] = req.query[i];

    }
    for (i in req.cookies){
        doc[i] = req.cookies[i];

    }

    mongo_api.insertDocuments(db, 'iosactive', doc, function(err, r){

        if(err){

            res.send('not saved due to '+err);
        }else{

            res.send('succeeded');
        }

    })

    next();

})


router.get('/iossacheck', function(req, res, next){

    var appid = req.query.appid;
    var idfa = req.query.idfa;
    var doc = {appid:appid, idfa:idfa};

    var collection = db.collection('iosactive');

    if(req.query.active_type=='strong'){

    collection.find(doc).limit(1).toArray(function(err, docs){

        if(err){
            res.send('internal error');
        }else{
            if(docs.length==1){
                res.send('data record')

            }else{//no such record since iosactive request issue

                res.send('no record');

            }

        }
    })
    }else{



        

    }


})


router.get('/geth', function(req, res, next){

    console.log(req);
    res.end('66666');


})

module.exports = router;
