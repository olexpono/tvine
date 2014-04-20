var configFile = require("./config");
var config = configFile();

var express = require('express');
var ejs   = require('ejs');
var path = require("path");
var mongoose = require("mongoose");
var _ = require("lodash");

console.log("Connecting to Mongo... ", config.mongo.uri);
var db = mongoose.connect(config.mongo.uri, config.mongo.options);

var modelsPath = path.join(__dirname, 'models');
var Vine = require(modelsPath + "/vine")
console.log("Importing Vine model.. ", modelsPath + "/vine");

var app = express();

app.use(express.static(path.join(config.root, 'public')));

app.engine('.ejs', require('ejs').__express);
app.set('view engine', 'ejs');

/*
  Examples:  /query/nyc
  Page Two:  /query/nyc&p=2
 */
app.get("/query/:query", function (req, res) {
  var page = req.query.p || "0";
  var query = req.params.query;

  console.log("Queried for: ", query);
  // TODO: fetch by tags from mongo
  Vine.find({tags: req.params.query}, "videoUrl", {limit: 92}, function (err, docs) {
    if (err) {
      console.log("Mongo error: ", err);
    } else {
      console.log("Returned documents: ", docs.length);
    }
    res.send(JSON.stringify({"vines": docs}));
  });
});

/*
  Example:  /query/________hire_me
  returns the last 20 vines
 */
app.get("/stream/recent", function (req, res) {
  Vine.find({}, "videoUrl", {limit: 20, sort: { _id : -1 }}, function (err, docs) {
    var vines = _.map(docs, function(doc) { return doc.videoUrl; });
    res.send(JSON.stringify({"vines": vines}));
  });
});

app.get("/", function(req, res) {
  var version = process.env.VERSION || '1';
  Vine.find({}, "videoUrl", {limit: 20, sort: { _id : -1 }}, function(err, docs) {
    var vines = _.map(docs, function(doc) {
      return doc.videoUrl;
    });
    // Fetch latest X vines from Mongo
    res.render("index", {
      cachebust: version,
      vines: vines
    }, function(err,html) {
      res.end(html);
    });
  });
});

console.log("Listening on port ", config.port);
app.listen(config.port);

