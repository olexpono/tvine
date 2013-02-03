var http = require('http');
var https = require('https');
var cheerio = require('cheerio');
var url = require('url');
var redis = require('redis');
var express = require('express');
var ejs   = require('ejs');
var redisServer   = process.env.REDIS_HOST || '127.0.0.1';
var redisPassword = process.env.REDIS_PASS || 'nodejitsudb4622528573.redis.irstack.com:f327cfe980c971946e80b8e975fbebb4';
var client = redis.createClient(null,redisServer);
if(redisServer == 'nodejitsudb4622528573.redis.irstack.com'){
  client.auth(redisPassword);
}

var Twit = require('twit');

var T = new Twit({
    consumer_key: 'tQMRFGDXyeNobjg4ITI8Gw',
    consumer_secret: 'w4NoaJKp53hjx0rF0g5YJivIuKo9AEGVixoTWAohyA',
    access_token: '40843553-VlpHMZ72JFBVzXYBYulmBm4fuw6gXa8ix6VqA6Lw4',
    access_token_secret: 'UYMWAPaASCUljrRGNPxfnPCHo6lhXQ3grNzKWxFxhgo'
  });

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
  client.get(filter,function(err,result){
    client.get('session_id',function(_err,id_from_redis){
      if(result){
        callback(result);
      }else{
        https.get({
          host: 'api.vineapp.com',
          path: filter,
          headers: {
            'vine-session-id': (id_from_redis) ? id_from_redis:'906277305146548224-5e08e0b8-4db0-4c4b-a062-3b1d13e7c6a4',
            'User-Agent': 'com.vine.iphone/1.0.1 (unknown, iPhone OS 6.0, iPhone, Scale/2.000000)'
          }
        }, function(res) {
          var str='';
          res.setEncoding('utf8');
          res.on('data', function(chunk) {
            str+=chunk;
          });
          res.on('end', function() {
            client.set(filter,str);
            client.expire(filter,60);
            callback(str);
          });
        });
      }
    });

  });
}
function searchTwitter(query,callback){
  T.get('search/tweets', { q: 'vine.co '+query+' since:2013-01-21',count:'40'}, function(err, reply) {
    var len = reply.statuses.length;
    var n = 0;
        for(var i in reply.statuses){
  //store it
          storeTweet(reply.statuses[i]);
          if(++n==len){
  //return it just like we would w/o twitter (almost)
            client.zrevrange('vine:'+query.toLowerCase(),'0','40',function(_err,_result){
              if(_result){
                var _ret = {data:{count:_result.length ,records:_result}};
                callback(JSON.stringify(_ret));
              }else{
                var _ret = {data:{count:0,records:[]}}
                callback(JSON.stringify(_ret));
              }
          })
          }
        }

    });
}
function twitterSnarf(query,page,method,callback){
  client.zrevrange('vine:'+query.toLowerCase(),'0','40',function(err,result){
    //if we dont already have this tag stored.

    if(result){
      if(result.length>40){
        var _ret = {data:{count:_result.length ,records:_result}};
        callback(JSON.stringify(_ret));
      }else{
        searchTwitter(query,function(d){
          callback(d);
        })
      }
    }else{
    //search for it
      searchTwitter(query,function(d){
        callback(d);
      })
    }
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
  twitterSnarf(query , page,'/timelines/tags/',function(result){
    res.end(result);
  });

  // vineSnarf(query , page,'/timelines/tags/',function(result){
  //   res.end(result);
  // });
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

  twitterSnarf('' , '', filter,function(result){
    res.end(result);
  });
  // vineSnarf('' , '', filter,function(result){
  //   res.end(result);
  // });
});

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.get("/", function(req, res) {
  var version = process.env.VERSION || '1';
  client.get('popularNow',function(err,data){
    //could alternatively just store the video url in a env variable
    //to save the call to redis and drop the redis dependency for index
    var _data = JSON.parse(data);
    res.render("index",{cachebust: version,popularVine: _data});
  });
});

app.listen(3000);

process.on('error',function(){
//catch the error and do nothing
});

/*
get popular from vine
*/
function getPopular(){
  vineSnarf('','','/timelines/popular',function(data){
 try{
          var popPage = JSON.parse(data);
          client.set('popularNow',JSON.stringify(popPage.data.records[0]));
 }catch(e){}
  });
}
/*
  we can get popular when we have api access
getPopular();
//fetch popular 4 times per day (every 6 hours)
setInterval(getPopular,21600);
*/




/*
get popular from vine
*/
function getPopular(){
  vineSnarf('','','/timelines/popular',function(data){
      var popPage = JSON.parse(data);
      client.set('popularNow',JSON.stringify(popPage.data.records[0]));
  });
}




/*
  store tweets in redis zsets
  vine:<tag> {<source_mp4>,<timestamp>}
  all_vines  {<source_mp4>,<timestamp>}
*/
function storeTweet(tweet){
  var url=tweet.entities.urls[0].expanded_url;
  var tags = tweet.entities.hashtags;
  if(url.indexOf('http://vine.co/')==0){
    https.get({
      host: 'vine.co',
      path: '/v/'+url.split('/v/')[1]
    }, function(res) {
      var str='';
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        str += chunk;
      });
      res.on('end', function() {
        var $ = cheerio.load(str); //jquery-ish
        var src = $('source').attr('src');
        if(typeof src =='string'){
           if(src.indexOf('.mp4') != -1){
            if(tags){
              for(var i in tags){
                client.zadd('vine:'+tags[i]['text'],+new Date(),src);
              }  
            }
            client.zadd('all_vines',+new Date(),src);
          }
        }
        
      });
    })
  } 
}
if(redisServer != 'nodejitsudb4622528573.redis.irstack.com'){
  var stream = T.stream('statuses/filter', { track: 'vine' });
  stream.on('tweet', storeTweet);  
}

