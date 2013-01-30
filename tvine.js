var http = require('http');
var https = require('https');
var url = require('url');
//we'll want to cache things for sure.
//var redis = require('redis');

var express = require('express');

var app = express();

// TODO - delete
// whitelist for fileserving
// var wl = ['/js/isotope-min.js','/test.html','/css/style.css'];
//https://api.vineapp.com/users/profiles/906345798374133760
///timelines/tags/nyc?page=2&size=20&anchor=(null)

// /timelines/global
// /timelines/popular
// /timelines/promoted
function vineSnarf(query,page,method,callback){
  page_str = (page)? '?page='+page+'&size=20&anchor=(null)' : '';
  filter = (query.length>1) ? method+query+page_str : method;
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
        callback(str);
      });
  });
}

/*
  Examples:  /query/nyc
  Page Two:  /query/nyc&p=2
 */
app.get("/query/:query", function (req, res) {
  var page = req.query.p || "1";
  var query = req.params.query;

  res.writeHead(200,{'Content-Type': 'application/json'});
  vineSnarf(query , page,'/timelines/tags/',function(result){
    res.end(result);//return
  });
});

/*
 * Examples:  /filter/global
 * Picks   :  /filter/promoted
 * Popular :  /filter/popular
 */
app.get("/filter/:filter", function (req, res) {
  var filter = (req.params.filter) ? req.params.filter : 'global';
  filter  = '/timelines/' + filter;

  res.writeHead(200,{'Content-Type': 'application/json'});
  vineSnarf('' , '', filter,function(result){
    res.end(result);//return
  });
});

app.use(express.static(__dirname + '/public'));
app.get("/", function(req, res) {
  res.sendfile(__dirname + "/public/index.html");
});

app.listen(3000);
