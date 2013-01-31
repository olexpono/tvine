//if on the second to last item call ajax again.
//attribution
//jarrod:  handle ajax logic//preload based on 

//ui/navigation

$.TVine = {
  init: function() {
    this.currentTags  = [];
    this.previousTags = [];
    this.playlist     = [];
    this.tagDataList  = [];
    this.totalVideos = 0;
    this.currentIdx  = 0;
    this.videoRef    = {};
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
        console.log("navigated to tags" + tagstring);
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
        window.location.hash = "/magic";
      }
    );
  },

  /* Utility to render a tag into stack */
  renderNewTag: function(val, count) {
    var tag_info = { tag: val, count: count };
    var rendered = $(Mustache.to_html(TMPL.tag, tag_info));
    rendered.insertBefore($(".tags > *:last-child"));
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
    this.totalVideos=0;
    console.log("Refreshing feed.");
    var newTags =
      _.filter(this.currentTags,
               function(tag) { return $.TVine.previousTags.indexOf(tag) < 0; });
    console.log("new tags: " + newTags);

    var removedTags =
      _.filter(this.previousTags,
               function(tag) { return $.TVine.currentTags.indexOf(tag) < 0; });
    console.log("removed tags: " + removedTags);
    var end_of_array_check = newTags.length;
    var count=0;
    var that = this;
    _.each(newTags,
      function(tag) {
        $.get('/query/' + tag, function(data) {
          $.TVine.addTag(tag, data);
          // re-interleave the videos each time you add a new tag.
          that.playlist = [];
          //we need to know when we're at the end of the list because $.get is async
          that.interleaveVideos();
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
    this.previousTags.push(tag);
    this.receiveVideos(data);
    this.renderNewTag(tag, data.data.count);
  },
  /* Utility used by refreshFeed, careful using this directly */
  removeTag: function(tag) {
    this.previousTags =
      _.filter(this.previousTags,
               function(prevtag) { return prevtag != tag; });
    $(".tags [data-hashtag='" + tag + "']").parent().remove();
    /* TODO -- update video pool on hashtag deletion */
  },

  /* circular list */
  getNextVideo: function(){
    this.currentIdx = (this.currentIdx+1) % this.playlist.length;
    return this.playlist[this.currentIdx];
    //load into view
  },

  /* circular list */
  getPreviousVideo: function(){
    this.currentIdx = Math.abs((this.currentIdx-1) % this.playlist.length);
    return this.playlist[this.currentIdx];
    //load into view
  },

  loadNextVideo: function(){
    this.video_ref.src(this.getNextVideo().videoLowURL);
    this.video_ref.play();
  },

  interleaveVideos: function(){
    var that = this;
     for(var i=0;i < this.totalVideos; i++){
      var current = this.tagDataList[ i % this.tagDataList.length ];
      if(current){
        this.playlist.push(current.shift())
        if(current.length==0){
          this.tagDataList.splice( i % this.tagDataList.length,1);
        }
      }
     }
  },

  receiveVideos: function(data) {
    this.totalVideos += data.data.records.length;
    if(data.data.records.length>1){
      this.tagDataList.push(data.data.records);  
    }
    /* TODO -- update video pool on new hashtag videos */
  },

  /* Update currentTags from a listener, then call this to navigate. */
  navigateToCurrentTags: function() {
    window.location.hash = this.currentTags.join("+");
  },

  setupListeners: function() {
    $(".tag-input").keyup(function(e) {
      if( $(".tag-input:focus") && e.keyCode == 13) {
        if ($.TVine.currentTags.indexOf($(".tag-input").val()) >= 0) {
        } else {
          var sanitized = $(".tag-input").val().replace(/![a-zA-Z0-9]/gi,"");
          $.TVine.currentTags.push(sanitized);
          $.TVine.navigateToCurrentTags();
        }
        $(".tag-input").val("");
      }
    });

    this.video_ref = _V_('current_video').ready(function(){
      //dont feel like hearing this while testing
      this.play();
      this.addEvent('ended',function(){
        $.TVine.loadNextVideo();
      })
    });
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
