var request = require('request');

var url = 'http://101.200.130.178/pushemail/send';


var send_issue = function(sub, body, type, cb){

    options = {
        'subject': sub,
        'body': body,
        'type': type

    }


    request.post({url:url, form: options}, function(err,httpResponse,body){

        cb(body);

    })


}

//test only

//send_body('hello world', 'send from landpage', 'admin', function(body){
//
//    console.log(body);
//
//
//});

exports.send_issue = send_issue;


