$(function() {

  console.log("templates", TMPL);

  $("#output").html(
    Mustache.render(TMPL.test, DATA)
  );

});
