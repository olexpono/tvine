var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
//we'll want to cache things for sure.
//var redis = require('redis');

//whitelist for fileserving
var wl = ['/isotope-min.js','/test.html','/css/style.css'];
//https://api.vineapp.com/users/profiles/906345798374133760
///timelines/tags/nyc?page=2&size=20&anchor=(null)
function vineSnarf(query,page,method,cb){
  page_str = (page)? '?page='+page+'&size=20&anchor=(null)' : '';
  https.get({
    host: 'api.vineapp.com',
    path: method+query+page_str,
    headers: {
      'vine-session-id': '906281047212298240-0f7e49ba-4f9c-492e-b63b-7f4939149fe1'
    }
  }, function(res) {
      var str='';
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        str+=chunk;
      });
      res.on('end', function() {
        cb(str);
      });
  });
}

/*
  example query :  /?q=nyc  
  page two      :  /?q=nyc&p=2
 */

http.createServer(function(req,res){
  //todo: if file exists
  if(req.url == wl[0] || req.url == wl[1] || req.url == wl[2]){
        fs.readFile(__dirname + req.url, function (err,data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
    return;
  });
  }else{
    var param = url.parse(req.url,true).query;
    var query = (param.q) ? param.q:'lol';
   
    //params.p is injectable here.  probably not the best
    var page = (param.p)? param.p:false;
    if(typeof query != 'undefined'){
      res.writeHead(200,{'Content-Type': 'application/json'});
      vineSnarf(query , page,'/timelines/tags/',function(result){
        res.end(result);//return
      });
    }else{
      res.end('user fail');//return
    }
  }
}).listen(8888,'localhost');


