$.TVine = {
  init: function() {
    this.setupRoutes();
  },
  setupRoutes: function() {
    crossroads.addRoute(
      "/{tagstring}",
      function(tagstring) {
        console.log("navigated to tags" + tagstring);
        // From here, split by +, fetch videos, and play
      }
    );
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
