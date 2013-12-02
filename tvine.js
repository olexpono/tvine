var http = require('http');
var https = require('https');
var cheerio = require('cheerio');
var url = require('url');
var redis = require('redis');
var express = require('express');
var ejs   = require('ejs');

/*
redis://nodejitsu:nodejitsudb6508309710.redis.irstack.com:f327cfe980c971946e80b8e975fbebb4@nodejitsudb6508309710.redis.irstack.com:6379 */
    
var redisServer   = process.env.REDIS_HOST || 'nodejitsudb4622528573.redis.irstack.com';
var redisPassword = process.env.REDIS_PASS || 'nodejitsudb4622528573.redis.irstack.com:f327cfe980c971946e80b8e975fbebb4';
var client = redis.createClient(null,redisServer);
if (redisServer == 'nodejitsudb4622528573.redis.irstack.com') {
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
var socketServer = http.createServer(app);
var io = require('socket.io').listen(socketServer);

io.set('log level', 1);
io.set('match origin protocol',true);

/* It's all port 80 on jitsu */
socketServer.listen(3000);

function searchTwitter(query,callback){
  T.get('search/tweets', { q: 'vine.co '+query+' since:2013-01-21',count:'40'}, function(err, reply) {
    // console.log("Response from twitter: ", reply);
    var _ret = {data:{count:0,records:[]}};
    if(!err || reply){
      var len = reply.statuses.length;
      var n = 0;
      for (var i in reply.statuses) {
        storeTweet(reply.statuses[i]);
        if(++n==len) {
          client.zrevrange('vine:'+query.toLowerCase(),'0','40',function(_err,_result){
            if(_result) {
              var _ret = {data:{count:_result.length ,records:_result}};
            }
          });
        }
      }
    }
    callback(JSON.stringify(_ret));
  });
}

function twitterSnarf(query,page,callback){
  var offset = (page - 1) * 40;
  var offset = (offset >= 0) ? offset : 0;

  client.zrevrange('vine:'+query.toLowerCase(),offset,'40',function(err,result){
    if(result){
      var _ret = {data:{count:result.length ,records:result}};
      callback(JSON.stringify(_ret));
    } else {
      //search for it
      searchTwitter(query,function(d){
        callback(d);
      });
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

  twitterSnarf(query, page, function(result){
    res.end(result);
  });
});

/* DISABLED
app.get('/tags/:amount',function(req,res){
  //impose limits
  var amount = (req.params.amount > 0 && req.params.amount <= 15)
               ? req.params.amount : 15;
  var now = Math.floor(Date.now()/1000);
  var bucket = now - (now % 300);
  client.zrevrange('trending_tags:' + bucket,'0',amount,function(err,resp){
      res.writeHead(200,{'Content-Type': 'application/json'});
      if (err) {
        res.end({status:'error'});
      } else {
        res.end(JSON.stringify(resp));
      }
  });
});
*/

/*
  tap into the vine
*/
app.get('/stream/:amount',function(req,res){
  //impose limits
  var amount = (req.params.amount > 0 && req.params.amount <= 15) 
               ? req.params.amount : 15;
  client.zrevrange('all_vines','0',amount,function(err,resp){
      res.writeHead(200,{'Content-Type': 'application/json'});
      if(err) res.end({status:'error'});
      if(resp){
        var _ret = {data:{count:resp.length ,records:resp}};
        res.end(JSON.stringify(_ret));
      }
  })
})

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.get("/", function(req, res) {
  var version = process.env.VERSION || '1';
  client.zrevrange('all_vines','0','10', function(err,vines){
    res.render("index", {
      cachebust: version,
      vines: vines
    });
  });
});


// we can get popular when we have api access
//lets leave this on until we get the realtime stuff done
//fetch popular every hour
//setInterval(getPopular,3600000);

/*
 get the mp4 string from vine and store it 
   vine:<tag> {<source_mp4>,<timestamp>}
   all_vines  {<source_mp4>,<timestamp>}
*/
function parseVine(url,tags){
  var now = Math.floor(Date.now()/1000);
  var bucket = now - (now % 30);
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
              //store tags into different sorted sets
              var multi = client.multi();
              multi.zadd('vine:'+tags[i]['text'], now, src);
              // multi.zincrby('alltime_tags', 1, tags[i]['text']);
              //time bucket based key names
              // multi.zincrby('trending_tags:' + bucket, 100, tags[i]['text']);
              // multi.zincrby('trending_tags:' + (bucket + 300), 1, tags[i]['text']);
              //clean up after itself
              // multi.expireat('trending_tags:' + bucket, bucket + 300);
              // multi.expireat('trending_tags:' + (bucket+300), bucket + 600);
              multi.exec();
            }
          }
          client.zadd('all_vines',now,src);
          io.sockets.volatile.emit('vineTweet',src);
        }
      }
    });
  });
}

/*
 * TODO add check for retweet.  if it's been retweeted we don't want it.(repeat)
  get the vine.co url from the tweet data.
*/
function parseTweet(tweet){
  // console.log("Parsing tweet with URLs", tweet.entities.urls);
  if(typeof tweet.entities.urls[0] !='undefined'){
    var url = tweet.entities.urls[0].expanded_url;
    var tags = tweet.entities.hashtags;
    if (url.indexOf('https://vine.co/v/') == 0){
      parseVine(url,tags);
    }
  }
}

var stream = T.stream('statuses/filter', { track: 'vine' });
stream.on('tweet', parseTweet);
