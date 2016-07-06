var express = require('express');
var router = express.Router();
var mongo_api = require('../modules/mongo_api');
var uuid = require('node-uuid');
var ys_uuid = require('../modules/yushan_util');

var db;
mongo_api.db_conn(function(getDB){//for pv

    db = getDB;
});

router.get('/iosactive', function(req, res, next){


    req.query.active_date = new Date();

    if(req.query.active_type=='strong') {


        console.log(req.cookies);


        req.query.ys_uuid = req.cookies.ys_uuid;

        mongo_api.insertDocuments(db, 'iosactive', req.query, function (err, r) {

            if (err) {

                res.send('not saved due to ' + err);
            } else {

                console.log(req.query);
                console.log('succeeded');

                res.send('succeeded');
            }

        })
    }else if(req.query.active_type=='weak'){

        var appid = req.query.appid;
        var ip = req.ips[0];//ip address can be from app or client itself
        var doc_inner = {'app_id':appid, 'sip':ip||null};//*app_id* and *ip* as query parameter
        var doc = {'all_info':{$elemMatch:doc_inner}};


        var collection = db.collection('yushan_user');
        collection.find(doc).toArray(function(err, docs){
                if(docs.length==0){

                    console.log('no matching device');
                    console.log(doc);
                    res.status(443).end();

                }else{
                    //console.log(docs);
                    var alt_ys_uuid = [];
                    var tmp = docs[0];
                    req.query.ys_uuid=docs.shift().ys_uuid;//make first match as ys_uuid
                    for(var item in docs){
                        alt_ys_uuid.push(item.ys_uuid);
                    }

                    req.query.alt_ys_uuid = alt_ys_uuid;//save other matched ys_uuid
                    var co_ios = db.collection('iosactive');


                    co_ios.find({ys_uuid:req.query.ys_uuid, appid:appid}).limit(1).next(function(err, doc){

                        if(doc){//second active

                           // console.log({_id:mongo_api.get_objID(doc._id)});

                            co_ios.findOneAndUpdate({_id:mongo_api.get_objID(doc._id)}, {$set:{re_active:true}}, function(err, data){

                                req.query.re_active = tmp.re_active = true;
                                res.json(tmp);
                            })

                        }else{//first active

                            req.query.re_active=tmp.re_active = false;

                            co_ios.insertOne(req.query, function(err, data){
                                if(err){
                                    console.log(err);
                                }
                                res.json(tmp)
                            })

                        }


                    })

                }

            })

        }else{

        res.cookie('ys_uuid', req.query.k, { maxAge: 600000*6*24*365, path:'/'});//record uid for ios active
        res.end('works');

    }


})


router.get('/iossacheck', function(req, res, next){

    var collection = db.collection('iosactive');
    var doc = {appid:req.query.appid, idfa:req.query.idfa};


    collection.find(doc).limit(1).toArray(function(err, docs){

        if(err){
            res.send('internal error');
        }else{
            if(docs.length==1){
                res.send('data record');

            }else{//no such record since iosactive request issue

                res.status(444).end();

            }

        }
    })


})


router.get('/download', function(req, res, next) {

    //console.log(req.cookies);


    if(req.cookies.ys_uuid&&req.query.ys_uuid){//existing user, new req from yushan framework. No need to write ys_user bcz yushan framework already did.

        res.redirect(req.query.url);

    }else if(!req.cookies.ys_uuid&&req.query.ys_uuid) {//new user, new req from yushan framework. No need to write ys_user bcz yushan framework already did.
        res.cookie('ys_uuid', req.query.ys_uuid, {maxAge: 600000 * 6 * 24 * 365, path: '/'});//record uid for ios active
        res.redirect(req.query.url);
    }else if(!req.cookies.ys_uuid&&!req.query.ys_uuid){//new user, new req from other channel
        var ys_uuid = uuid.v4();
        var doc = {};
        doc.sip = req.ips[0];
        doc.app_id = req.query.app_id;//short link binding
        doc.c2 = req.query.c2;//short link binding
        doc.dlflag = 1;
        doc.device = ys_uuid.get_mobile_type(req.headers['user-agent']);

        var collection = db.collection('yushan_user');
        collection.insertOne({ys_uuid:ys_uuid, all_info:[doc], qt:0}, function(err, data){//create
            res.cookie('ys_uuid', ys_uuid, {maxAge: 600000 * 6 * 24 * 365, path: '/'});//record uid for ios active
            res.redirect(req.query.url);

        })

    }
})


module.exports = router;
