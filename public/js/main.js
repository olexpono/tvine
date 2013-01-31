$.TVine = {
  init: function() {
    this.currentTags = [];
    this.previousTags = [];

    this.setupRoutes();
    this.setupListeners();
  },

  setupRoutes: function() {
    /* TODO Add route for filters?
     * Or should we interweave them with tags?
     * i.e. #/magic+_popular
     */
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
  },

  /* Refreshes currentTags -> feed
   * Fetches data + renders new tags
   * Updates previousTags to currentTags */
  refreshFeed: function() {
    console.log("Refreshing feed.");
    var newTags =
      _.filter(this.currentTags,
               function(tag) { return $.TVine.previousTags.indexOf(tag) < 0; });
    console.log("new tags: " + newTags);

    var removedTags =
      _.filter(this.previousTags,
               function(tag) { return $.TVine.currentTags.indexOf(tag) < 0; });
    console.log("removed tags: " + removedTags);

    _.each(newTags,
      function(tag) {
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

  receiveVideos: function(data) {
    console.log(data);
    /* TODO -- update video pool on new hashtag videos */
  },

  setupListeners: function() {
    $(".tag-input").keyup(function(e) {
      if( $(".tag-input:focus") && e.keyCode == 13) {
        if ($.TVine.currentTags.indexOf($(".tag-input").val()) >= 0) {
          console.log("tag already exists");
        } else {
          $.TVine.currentTags.push($(".tag-input").val());
          // Navigate to sorted currentTags instead.
          window.location.hash = $.TVine.currentTags.join("+");
        }
        $(".tag-input").val("");
      }
    });
  }
}


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
