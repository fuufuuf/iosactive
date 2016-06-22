/*
 * input req.headers['user-agent']
 * */
var get_mobile_type = function(u){

    var type= u.substring(u.indexOf("(")+1,u.indexOf(")"));
//            var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android÷’∂À

    if(u.indexOf('Android') > -1){
        type = 'Android:'+ type;

    }
    var isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios÷’∂À
    if(isIOS){

        type = 'iOS:'+ type;
    }
    return type;

}

Array.prototype.contains=function(obj) {
    var index=this.length;
    while (index--){
        if(this[index]===obj){
            return true;
        }
    }
    return false;
}

exports.get_mobile_type = get_mobile_type;
