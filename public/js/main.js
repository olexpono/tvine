/*
need to store as an object 
*/


$.TVine = {
  init: function() {
    this.tagData = {};
    this.currentTags  = [];
    this.previousTags = [];
    this.playlist     = [];
    this.setupRoutes();
    this.setupListeners();

    $(".tag-input").autoGrowInput({
      maxWidth: 500,
      minWidth: 70,
      comfortZone: 50
    });
  },

  setupRoutes: function() {
    crossroads.addRoute(
      "/{tagstring}",
      function(tagstring) {
        console.log("Navigated to tags" + tagstring);
        // From here, split by +, fetch videos, and play
        console.log("Split ", tagstring.split("+"));

        $.TVine.currentTags = _.sortBy( tagstring.split("+"), function(str) { return str; });
        $.TVine.refreshFeed();
      }
    );
    crossroads.addRoute(
      "/",
      function() {
        console.log("Default route detected.");
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
    var end_of_array_check = newTags.length;
    var count=0;
    _.each(newTags,
      function(tag) {
        $.TVine.previousTags.push(tag);
        $.get('/query/' + tag, function(data) {
          $.TVine.addTag(tag, data);
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
    }
    this.loop((this.currentTags.length == 0 ))
  },
  /* Utility used by refreshFeed, careful using this directly */
  removeTag: function(tag) {
    this.previousTags =
      _.filter(this.previousTags,
               function(prevtag) { return prevtag != tag; });
    $(".tags [data-hashtag='" + tag + "']").parent().remove();

    this.removeVideos(tag);
    this.loop((this.currentTags.length == 0 ))
  },

  /* circular list */
  getNextVideo: function(){
    /* TODO - fetch more than one page for given tags */
    /* Idea for paging: If playlist.shift() is the last video in any tagData, fetch more for that tag */
    this.playlist.push(this.playlist.shift());
    return this.playlist[0];
  },

  /* circular list */
  getPreviousVideo: function(){
    this.playlist.unshift(_.last(this.playlist));
    this.playlist.pop();
    return this.playlist[0];
  },

  loadNextVideo: function(){
    this.video_ref.src(this.getNextVideo().videoLowURL);
    this.video_ref.play();
  },

  addVideos: function(tag, records) {
    var spacing = 1;
    if (typeof this.tagData[tag] == "undefined") {
      this.tagData[tag] = _.union(this.tagData[tag],records);
    }
    /* Inject empty values into records to space them out,
     * then zip them with the current playlist.
     * more active tags => more empty values between each of the new videos */

    /* If all tags were the same page length, and we didn't want to stack more up closer
     * the /2 plus the Math function should be removed */
    spacing = Math.floor(_.size(this.tagData) / 2);
    records = _.reduce(
      records, 
      function (paddedArray, record) {
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
        function(queued) {
          return $.TVine.tagData[tag].indexOf(queued) < 0;
        }
      );
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

    this.video_ref = _V_('current_video').ready(function(){
      this.play();
      this.addEvent('ended',function(){
        $.TVine.loadNextVideo();
      })
    });
    this.adjustOnResize();
    $(window).resize(function() {
      $.TVine.adjustOnResize();
    });
    $(".tag-input").focus();

    $(document).idleTimer(3500, {startImmediately: false});
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
    })
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

});
