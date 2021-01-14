const https = require('https');

const KEY = '6rxxp4rgs5i7srf5ic9xq5riuscucpor5nsyfs6e'

let buffer = [];

function _queryInfo(key){
    let res = buffer.findIndex(b=>b.key == key)
    
    res = JSON.parse( buffer.splice(res,1)[0].buff )
    if (res.results) {res = res.results}
  
    return res
}

let onendsubscribe = function(key, resolve){
    return function(){
        let res = _queryInfo(key)
        if (res.result){
            resolve("result")
        }else{
            resolve("success")
        }
    }
}

let onerror = function(key){
    return function(e){
        console.log(e)
    }
}

let ondata = function(key){
    return function(body){
        let buf = buffer.findIndex(b=>b.key == key )
        buffer[buf].buff += body.toString()
    }
}


let responseCallback = function(key, resolve){
    return function(res){
        res.on('data', ondata(key));
        res.on('end', onendsubscribe(key, resolve));
        res.on('error', onerror(key))
    }
}

module.exports = function subscribe(list_ids="",email,name="noname", key=KEY){
    return new Promise((resolve, reject)=>{
        let keyz = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
        
        buffer.push({
            key: keyz,
            buff:""
        })
        
        https.get('https://api.unisender.com/ru/api/subscribe?format=json&api_key='+
        key + 
        '&list_ids=' + list_ids + "20502076,20518663" +
        '&fields[email]=' + email +
        '&fields[Name]=' + name +
        '&double_optin=3', responseCallback(keyz, resolve) )
    })
}


