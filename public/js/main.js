/*
need to store as an object 
*/

$.TVine = {
  init: function() {
    this.tagData = {};
    this.tagData.noMore = [];
    this.currentTags  = [];
    this.previousTags = [];
    this.playlist     = [];
    this.realtimeList = realtime;//first two are baked into template
    this.liveMode     = true;
    this.setupRoutes();
    this.setupListeners();

    /* Show header for first three seconds only */
    setTimeout( function() {
      $(".overlay").removeClass("shown");
    }, 3000);

    $(".tag-input").autoGrowInput({
      maxWidth: 500,
      minWidth: 90,
      comfortZone: 50
    });
    $(".tag-input").focus();
  },

  setupRoutes: function() {
    crossroads.addRoute(
      "/{tagstring}",
      function(tagstring) {
        console.log("Navigated to tags" + tagstring);
        // From here, split by +, fetch videos, and play
        console.log("Split ", tagstring.split("+"));

        $.TVine.currentTags = _.sortBy( _.compact(tagstring.split("+")), function(str) { return str; });

        $("[property='og:title']").attr("content", $.TVine.currentTags.join(", ") + " on Ch6");
        $.TVine.toggleLive(false);
        $.TVine.refreshFeed();
      }
    );
    crossroads.addRoute(
      "/",
      function() {
        console.log("Default route detected.");
        $.TVine.toggleLive(true);
        $.TVine.refreshFeed();
      }
    );
  },

  /* Utility to render a tag into stack */
  renderNewTag: function(val, count) {
    var tag_info = { tag: val, count: count };
    var rendered = $(Mustache.to_html(TMPL.tag, tag_info));
    rendered.insertBefore($(".tags > .tag-input"));
    rendered.find(".close").click(function() {
      $.TVine.currentTags = _.filter(
        $.TVine.currentTags,
        function(tag) { return tag != tag_info.tag; }
      );
      $.TVine.navigateToCurrentTags();
    });
    setTimeout( function() {
      rendered.find(".tag").removeClass("just-inserted");
    }, 750);
  },

  /* Refreshes currentTags -> feed
   * Fetches data + renders new tags
   * Updates previousTags to currentTags */
  refreshFeed: function() {
    var newTags =
      _.filter(this.currentTags,
               function(tag) { return $.TVine.previousTags.indexOf(tag) < 0; });

    var removedTags =
      _.filter(this.previousTags,
               function(tag) { return $.TVine.currentTags.indexOf(tag) < 0; });
    _.each(newTags,
      function(tag) {
        $.TVine.previousTags.push(tag);
        console.log('in ',tag);

        $.get('/query/'+tag,function(data){
          $.TVine.addTag(tag,data);
        });
      }
    );
    _.each(removedTags,
      function(tag) {
        $.TVine.removeTag(tag);
      }
    );
  },

  /* Utility used by refreshFeed, careful using this directly */
  addTag: function(tag, data) {
    if (data.data.records.length > 1){
      this.renderNewTag(tag, data.data.count);
      this.addVideos(tag, data.data.records);
    } else {
      this.inputAlert("No " + _.escape(tag) + " vines found.");
      this.currentTags = _.without(this.currentTags,tag);
      this.navigateToCurrentTags();
    }
    //this.loop((this.currentTags.length == 0 ));
  },

  /* Utility used by refreshFeed, careful using this directly */
  removeTag: function(tag) {
    this.previousTags =
      _.filter(this.previousTags,
               function(prevtag) { return prevtag != tag; });
    $(".tags [data-hashtag='" + tag + "']").parent().remove();
    this.removeVideos(tag);
    //this.loop((this.currentTags.length == 0 ));
  },

  toggleLive: function(isLive){
    this.liveMode = isLive;
  },

  getNextVideo: function(){
    var justWatched = this.playlist.shift();
    if(typeof justWatched.tag =='undefined')
    var next = this.tagData[justWatched.tag];
    var nextIdx= (!_.isUndefined(next)) ? next.indexOf(justWatched):-1;
    var lastIdx = (!_.isUndefined(next)) ? next.length : -2;
    if(nextIdx == lastIdx){
      //fetch next page
      var page = 2;
      if(this.tagData[justWatched.tag].page){
        ++this.tagData[justWatched.tag].page;
      }
      if(!_.isUndefined(this.tagData.noMore(justWatched.tag))){
        $.get('/query/'+justWatched.tag+'?p='+page,function(data){
          if(data.data.records.length == 0){
            $.TVine.tagData.noMore.push(justWatched.tag);
          }else{
            $.TVine.addVideos(justWatched.tag,data.data.records);
          }
        });
      }
    }
    //preload the next video if it exists 
    if(!_.isUndefined(this.playlist[1])){
      $('#video_preloader').attr('src',this.playlist[1].videoLowURL);
    }
    this.playlist.push(justWatched);
    console.log(this.playlist[0].tag);
    return this.playlist[0];
  },

  getPreviousVideo: function(){
    this.playlist.unshift(_.last(this.playlist));
    this.playlist.pop();
    return this.playlist[0];
  },

  /* return the next live video  and preload the following one*/
  getNextLiveVideo: function(){
    var justWatched = this.realtimeList.shift();

    if(this.realtimeList.length < 3){
      this.realtimeList.push(justWatched);
    }
    if(!_.isUndefined(this.realtimeList[1])){
      //preload the next video if it exists 
      $('#video_preloader').attr('src',this.realtimeList[1]);
    }
    return this.realtimeList[0];
  },

  loadNextVideo: function(){
    if (this.playlist.length < 1) {
      // Go to Live View if we exhaust the playlist / no videos found.
      window.location.hash = "";
    }
    if(this.liveMode || this.playlist.length < 1) {
      this.video_ref.src(this.getNextLiveVideo());
    } else {
      this.video_ref.src(this.getNextVideo().videoLowURL);
    }
    this.video_ref.play();
  },

  addVideos: function(tag, records) {
    var spacing = 1;

    this.tagData[tag] = _.compact(_.union(this.tagData[tag],records));
    /* Inject empty values into records to space them out,
     * then zip them with the current playlist.
     * more active tags => more empty values between each of the new videos */

    /* If all tags were the same page length, and we didn't want to stack more up closer
     * the /2 plus the Math function should be removed */

    spacing = Math.floor((_.size(this.tagData)-1) / 2);

    records = _.reduce(
      records, 
      function (paddedArray, record) {
        if (typeof record == 'string') {
          record = {videoLowURL:record,tag:tag};  
        } else {
          record = {videoLowURL:record.videoLowURL,tag:tag};  
        }

        paddedArray.push(record);
        for (var i = 0; i < spacing; i++) {
          paddedArray.push(undefined);
        }
        return paddedArray;
      },
      []
    );

    this.playlist =
      _.compact(
        _.flatten(
          _.zip(this.playlist, records)
        )
      );
  },

  removeVideos: function(tag) {
    if (typeof this.tagData[tag] == "undefined") {
      return;
    }
    var currentVideo = $.TVine.playlist[0];
    /* Currently playing video always preserved in case total videos goes to 0. */

    this.playlist =
      _.filter(
        _.rest(this.playlist),
        function(queued){
          return (queued.tag != tag);
        }
      );
    var tmp = {}
    //rebuild tag data
    for(var i in this.tagData){
      if(i != tag){
        tmp[i] = this.tagData[i];
      }
    }

    this.tagData = tmp;
    this.playlist.push(currentVideo);
  },

  toggleMute: function(){
    if(this.video_ref.volume()){
      this.video_ref.volume(0);
    }else{
      this.video_ref.volume(1);
    }
  },

  loop: function(turnLoopOn){
    if(turnLoopOn){
      $('video').attr('loop');
    }else{
      $('video').removeAttr('loop');
    }
  },

  /* Update currentTags from a listener, then call this to navigate. */
  navigateToCurrentTags: function() {
    window.location.hash = this.currentTags.join("+");
  },

  adjustOnResize: function() {
    var heightOfVideoBox = Math.min($(".video-box").width(), window.innerHeight);
    console.log("height of video-box :: " + heightOfVideoBox);
    $(".video-box").css("padding-bottom", heightOfVideoBox);
    $(".container").css("max-height", heightOfVideoBox);
    $(".overlay").css("width", heightOfVideoBox);
    $(".tags").css("width", heightOfVideoBox);
  },

  inputAlert: function(message) {
    $(".input-overlay-message").text(message);
  },

  setupListeners: function() {
    $(".tag-input").keyup(function(e) {
      if( $(".tag-input:focus") && e.keyCode == 13) {
        if ($.TVine.currentTags.indexOf($(".tag-input").val()) >= 0) {
          $.TVine.inputAlert("You're already watching that tag!");
        } else {
          var sanitized = $(".tag-input").val().replace(/![a-zA-Z0-9]/gi,"");
          $.TVine.currentTags.push(sanitized);
          $.TVine.navigateToCurrentTags();

          if ($.TVine.currentTags.length == 1) {
            $.TVine.inputAlert("Now add a few more and sit back!");
          } else {
            $.TVine.inputAlert("");
          }
        }
        $(".tag-input").val("");
      }

      if( $(".tag-input").val() == "" ) {
        $(".tag-input").addClass("clear");
      } else {
        $(".tag-input").removeClass("clear");
      }
    });
    $(".tag-input").blur(function() {
      $(".tag-input").val("");
    });

    this.video_ref = _V_('current_video').ready(function(){
      this.play();
      var that = this;
      this.addEvent('error',function(){
        that.play();
      });
      this.addEvent('ended',function(){
          $.TVine.loadNextVideo();
      });
    });
    this.adjustOnResize();

    $(window).resize(function() {
      $.TVine.adjustOnResize();
    });

    $(document).idleTimer(5000, {startImmediately: false});
    $(document).on( "idle.idleTimer", function() {
      $("body").addClass("idle");
    });
    $(document).on( "active.idleTimer", function() {
      $("body").removeClass("idle");
      $(".tag-input").focus();
    });

    /*click to pause/play*/
    $('video').click(function(){
      _V_('current_video').ready(function(){
        if(this.paused()){
          this.play();
        }else{
          this.pause();
        }
      });
    });
    //why doesn't this work
    //$('#current_video').dblclick(function(){
    //  $.TVine.loadNextVideo();
    //});
  }
} /* END TVine */


$(function() {
  console.log("templates", TMPL);

  $.TVine.init();
  crossroads.routed.add(console.log, console);
  var parseHash = function(newHash, oldHash) {
    crossroads.parse(newHash);
  }

  hasher.initialized.add(parseHash);
  hasher.changed.add(parseHash);
  hasher.init();

  //todo make this configurable
  var socket = io.connect('http://tvine.co:8888');
  socket.on('vineTweet', function (data) {
    if($.TVine.realtimeList.length > 21) {
      $.TVine.realtimeList.splice(2,1);
    }
    $.TVine.realtimeList.push(data);
  });
});

