var express = require('express');
var router = express.Router();
var mongo_api = require('../modules/mongo_api');
var uuid = require('node-uuid');
var ys_util = require('../modules/yushan_util');

var db;
mongo_api.db_conn(function(getDB){//for pv

    db = getDB;
});

router.get('/test', function(req, res, next){

    console.log('***********************');
    console.log(req.ips);
    console.log('***********************');

    res.end();

})

router.get('/iosactive', function(req, res, next){


    req.query.active_date = new Date();
    req.query.channel = req.cookies.channel;
    req.query.dl_date = req.cookies.dl_date;

    console.log('active cookie');
    console.log(req.cookies);


    if(req.query.active_type=='strong'&&req.cookies.ys_uuid) {

        console.log('strong!');
        req.query.ys_uuid = req.cookies.ys_uuid;
        var ip = req.ips[0];//ip address can be from app or client itself

        set_details({'ys_uuid':req.query.ys_uuid, 'all_info.app_id':req.query.appid}, req.query.appid, ip, req, res);//data -> iosactive

    } else if(req.query.active_type=='weak'||req.query.active_type=='strong'){

        if(req.query.active_type=='weak'){

            console.log('weak');
        }else{

            console.log('strong|weak');
            req.query.active_type = 'strong|weak';
        }

        var appid = req.query.appid;
        var ip = req.ips[0];//ip address can be from app or client itself
        var doc_inner = {'app_id':appid, 'sip':ip||null};//*app_id* and *ip* as query parameter
        var doc = {'all_info':{$elemMatch:doc_inner}};
        set_details(doc, req.query.appid, ip, req, res);//data -> iosactive
        
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

    res.cookie('channel', req.query.channel||'unknown', {maxAge: 600000 * 6 * 24 * 365, path: '/'});//set cookies to record channel
    res.cookie('dl_date', new Date(), {maxAge: 600000 * 6 * 24 * 365, path: '/'});//set cookies to record channel



    if(req.cookies.ys_uuid&&req.query.ys_uuid){//existing user, new req from yushan framework. No need to write ys_user bcz yushan framework already did.

        console.log('existing yushan user');

        res.redirect(req.query.url);

    }else if(!req.cookies.ys_uuid&&req.query.ys_uuid) {//new user, new req from yushan framework. No need to write ys_user bcz yushan framework already did.
        console.log('new user from yushan framework');

        res.cookie('ys_uuid', req.query.ys_uuid, {maxAge: 600000 * 6 * 24 * 365, path: '/'});//record uid for ios active
        console.log(req.query.ys_uuid);
        res.redirect(req.query.url);
    }else if(!req.cookies.ys_uuid&&!req.query.ys_uuid){//new user, new req from other channel
        console.log('new user from other channel');
        var ys_uuid = uuid.v4();
        var doc = {};
        doc.sip = req.ips[0];
        doc.app_id = req.query.app_id;//short link binding
        doc.c2 = req.query.c2;//short link binding
        doc.dlflag = 1;
        doc.device = ys_util.get_mobile_type(req.headers['user-agent']);
        doc.channel = req.query.channel||'unknown';
        doc.dl_date = new Date();//record download time

        var collection = db.collection('yushan_user');
        collection.insertOne({ys_uuid:ys_uuid, all_info:[doc], qt:0}, function(err, data){//create yushan_user
            res.cookie('ys_uuid', ys_uuid, {maxAge: 600000 * 6 * 24 * 365, path: '/'});//record uid for ios active
            res.redirect(req.query.url);

        })

    }else if(req.cookies.ys_uuid&&!req.query.ys_uuid){//existing yushan user, but req from other channel. Need to update ys_user info

        console.log('existing yushan user, but req from other channel');

        var doc = {}
        doc.app_id = req.query.app_id;//short link binding
        doc.sip = req.ips[0];
        doc.c2 = req.query.c2;//short link binding
        doc.dlflag = 1;
        doc.device = ys_util.get_mobile_type(req.headers['user-agent']);
        doc.channel = req.query.channel||'unknown';
        doc.dl_date = new Date();//record download time


        mongo_api.updateD(db, 'yushan_user', {ys_uuid:req.cookies.ys_uuid}, {$inc:{qt:1}, $push:{all_info: doc}}, function(err, data){

            if(err){

                console.log('illegal ys_uuid cookie');
            }
            res.redirect(req.query.url);

        })



    }
})

var set_details = function(doc, app_id, device_ip, req, res){
    var collection = db.collection('yushan_user');
    collection.find(doc).sort({_id:-1}).toArray(function(err, docs){
        if(docs.length==0){

            console.log('no matching device');
            console.log(doc);
            res.status(443).end();

        }else{
            var alt_ys_uuid = [];
            var tmp = docs[0];
            tmp.all_info.forEach(function(item){

                if(item['app_id']==app_id){
                    req.query.details = item;
                }
            })
            //req.query.details = tmp.all_info[tmp.qt];//retrieve last all_info
            req.query.device_ip = device_ip;
            req.query.ys_uuid=docs.shift()['ys_uuid'];//make first match as ys_uuid
            for(var item in docs){//list all alternative ys_uuid
                alt_ys_uuid.push(docs[item]['ys_uuid']);
            }

            req.query.alt_ys_uuid = alt_ys_uuid;//save other matched ys_uuid
            var co_ios = db.collection('iosactive');


            //console.log('ios active info');
            //console.log(req.query);

            co_ios.insertOne(req.query, function(err, data){
                if(err){
                    console.log(err);
                }
                res.json(req.query);
            })
            /*
             *
             * re-active not in use
             * */


            //co_ios.find({ys_uuid:req.query.ys_uuid, appid:appid}).limit(1).next(function(err, doc){
            //
            //    if(doc){//second active
            //
            //       // console.log({_id:mongo_api.get_objID(doc._id)});
            //
            //        co_ios.findOneAndUpdate({_id:mongo_api.get_objID(doc._id)}, {$set:{re_active:true}}, function(err, data){
            //
            //            req.query.re_active = tmp.re_active = true;
            //            res.json(tmp);
            //        })
            //
            //    }else{//first active
            //
            //        req.query.re_active=tmp.re_active = false;
            //
            //        co_ios.insertOne(req.query, function(err, data){
            //            if(err){
            //                console.log(err);
            //            }
            //            res.json(tmp)
            //        })
            //
            //    }
            //
            //
            //})

        }

    })





}


module.exports = router;
