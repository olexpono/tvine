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

// /timelines/global
// /timelines/popular
// /timelines/promoted
function vineSnarf(query,page,method,cb){
  page_str = (page)? '?page='+page+'&size=20&anchor=(null)' : '';
  filter = (query.length>1) ? method+query+page_str:method;
  console.log(filter);
  https.get({
    host: 'api.vineapp.com',
    path: filter,
    headers: {
      'vine-session-id': '906281047212298240-3c6bc1dd-7517-42a5-85c2-75a79e804d9b'
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
    var query = param.q;
   
    //params.p is injectable here.  probably not the best
    var page = (param.p)? param.p:false;
    if(typeof query != 'undefined'){
      res.writeHead(200,{'Content-Type': 'application/json'});
      vineSnarf(query , page,'/timelines/tags/',function(result){
        res.end(result);//return
      });
    }else{
      var filter = 
      filter = (param.filter) ? param.filter:'global';
      filter  = '/timelines/'+filter;
      res.writeHead(200,{'Content-Type': 'application/json'});
      vineSnarf('' , '', filter,function(result){
        res.end(result);//return
      });
    }
  }
}).listen(2,'0.0.0.0');


