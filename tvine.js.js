var http = require('http');
var https = require('https');
var url = require('url');

//we'll want to cache things for sure.
//var redis = require('redis');

function vineSnarf(query,method,cb){
  https.get({
    host: 'api.vineapp.com',
    path: method+query,
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
http.createServer(function(req,res){
  var query = url.parse(req.url,true).query.q;

  if(typeof query != 'undefined'){
  	res.writeHead(200,{'Content-Type': 'application/json'});
  	vineSnarf(query,'/timelines/tags/',function(result){
  		res.end(result);//return
  	});
  }else{
  	res.end('user fail');//return
  }
}).listen(8888,'localhost');



