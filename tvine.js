var express = require('express');
var ejs   = require('ejs');
var configFile = require("./config");
var config = configFile();
var path = require("path");

var app = express();


app.use(express.static(path.join(config.root, 'public')));

app.engine('.ejs', require('ejs').__express);
app.set('view engine', 'ejs');

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

/*
 * Live AKA TV Mode
 */
app.get('/stream/:amount',function(req,res){
  res.writeHead(200,{'Content-Type': 'application/json'});
  // TODO: fetch latest vines from mongo
  res.end(JSON.stringify(_ret));
})


app.get("/", function(req, res) {
  var version = process.env.VERSION || '1';
  var vines = [
    "https://v.cdn.vine.co/r/videos/897DACAC621069108883244687360_239cd6352c3.0.2.15878161548568203682.mp4?versionId=fEtmuXo7pNq6CtJ2yZA.Lqs7.M_9fLe3",
    "https://mtc.cdn.vine.co/r/videos/DDACF5DEDC1069109456903761920_27972ec815a.0.1.3800890454357548189.mp4?versionId=i9_86xzIlLuR65sUegl0.7HWvrsnUJj5",
    "https://mtc.cdn.vine.co/r/videos/E670C97D6D1069109709392719872_1d7c9d7a7b6.4.6.9370326201979351750.mp4?versionId=D92WllCmVq360t8mXvdYrZE9pWSQxS2r",
    "https://mtc.cdn.vine.co/r/videos/DDACF5DEDC1069109456903761920_27972ec815a.0.1.3800890454357548189.mp4?versionId=i9_86xzIlLuR65sUegl0.7HWvrsnUJj5",
    "https://mtc.cdn.vine.co/r/videos/F23C12CDC61069109254415396864_25c48bb9c58.0.2.5296819634288556892.mp4?versionId=HHLeYUw6Yv5xMjpQkEp3fNMdnOTu7oob",
    "https://mtc.cdn.vine.co/r/videos/E670C97D6D1069109709392719872_1d7c9d7a7b6.4.6.9370326201979351750.mp4?versionId=D92WllCmVq360t8mXvdYrZE9pWSQxS2r",
    "https://mtc.cdn.vine.co/r/videos/406C5DA6431069114230847995904_25791d2deae.0.2.15604110730341182405.mp4?versionId=WAhyeiprHFapQTO7FwkGrmUC.oQ7y7rt",
    "https://mtc.cdn.vine.co/r/videos/05DCCDEEAF1069115150969212928_2bd3eb91aff.0.2.6112991190434063097.mp4?versionId=zIBPV7O5PpRYoU7_QiyjC7QcWg1xwrDx",
    "https://mtc.cdn.vine.co/r/videos/E670C97D6D1069109709392719872_1d7c9d7a7b6.4.6.9370326201979351750.mp4?versionId=D92WllCmVq360t8mXvdYrZE9pWSQxS2r",
    "https://v.cdn.vine.co/r/videos/DFAB3FED3A1069115194829107200_2e247e541e3.0.1.9806393447917276049.mp4?versionId=fnETN31TCii0nyfl04jGTDdBiOAqSWa7",
    "https://mtc.cdn.vine.co/r/videos/DDACF5DEDC1069109456903761920_27972ec815a.0.1.3800890454357548189.mp4?versionId=i9_86xzIlLuR65sUegl0.7HWvrsnUJj5",
    "https://mtc.cdn.vine.co/r/videos/DDACF5DEDC1069109456903761920_27972ec815a.0.1.3800890454357548189.mp4?versionId=i9_86xzIlLuR65sUegl0.7HWvrsnUJj5",
    "https://mtc.cdn.vine.co/r/videos/F23C12CDC61069109254415396864_25c48bb9c58.0.2.5296819634288556892.mp4?versionId=HHLeYUw6Yv5xMjpQkEp3fNMdnOTu7oob",
    "https://mtc.cdn.vine.co/r/videos/DDACF5DEDC1069109456903761920_27972ec815a.0.1.3800890454357548189.mp4?versionId=i9_86xzIlLuR65sUegl0.7HWvrsnUJj5",
    "https://mtc.cdn.vine.co/r/videos/E670C97D6D1069109709392719872_1d7c9d7a7b6.4.6.9370326201979351750.mp4?versionId=D92WllCmVq360t8mXvdYrZE9pWSQxS2r",
    "https://mtc.cdn.vine.co/r/videos/62A06CE6DC1069124707338829824_13a5d56e25b.4.8.6488204409840714382.mp4?versionId=WTFX8A6BTfkMJ12u9CmIVHkO20NPeTnp"
  ]
  // Fetch latest X vines from Mongo
  res.render("index", {
    cachebust: version,
    vines: vines
  }, function(err,html) {
    res.end(html);
  });
});

app.listen(3000);
