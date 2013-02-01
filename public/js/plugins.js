// Avoid `console` errors in browsers that lack a console.
if (!(window.console && console.log)) {
    (function() {
        var noop = function() {};
        var methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
        var length = methods.length;
        var console = window.console = {};
        while (length--) {
            console[methods[length]] = noop;
        }
    }());
}

/* http://stackoverflow.com/questions/1288297/jquery-auto-size-text-input-not-textarea */
(function($){

$.fn.autoGrowInput = function(o) {

    o = $.extend({
        maxWidth: 1000,
        minWidth: 0,
        comfortZone: 70
    }, o);

    this.filter('input:text').each(function(){

        var minWidth = o.minWidth || $(this).width(),
            val = '',
            input = $(this),
            testSubject = $('<tester/>').css({
                position: 'absolute',
                top: -9999,
                left: -9999,
                width: 'auto',
                fontSize: input.css('fontSize'),
                fontFamily: input.css('fontFamily'),
                fontWeight: input.css('fontWeight'),
                letterSpacing: input.css('letterSpacing'),
                whiteSpace: 'nowrap'
            }),
            check = function() {

                if (val === (val = input.val())) {return;}

                // Enter new content into testSubject
                var escaped = val.replace(/&/g, '&amp;').replace(/\s/g,' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                testSubject.html(escaped);

                // Calculate new width + whether to change
                var testerWidth = testSubject.width(),
                    newWidth = (testerWidth + o.comfortZone) >= minWidth ? testerWidth + o.comfortZone : minWidth,
                    currentWidth = input.width(),
                    isValidWidthChange = (newWidth < currentWidth && newWidth >= minWidth)
                                         || (newWidth > minWidth && newWidth < o.maxWidth);

                // Animate width
                if (isValidWidthChange) {
                    input.width(newWidth);
                }

            };

        testSubject.insertAfter(input.parent());

        $(this).bind('keyup keydown blur update', check);

    });

    return this;

};

})(jQuery);
// Place any jQuery/helper plugins in here.


/*! Idle Timer - v0.9.2 - 2013-01-06
* https://github.com/mikesherov/jquery-idletimer
* Copyright (c) 2013 Paul Irish; Licensed MIT */
(function(e){e.idleTimer=function(t,i,d){d=e.extend({startImmediately:!0,idle:!1,enabled:!0,timeout:3e4,events:"mousemove keydown DOMMouseScroll mousewheel mousedown touchstart touchmove"},d),i=i||document;var l=e(i),a=l.data("idleTimerObj")||{},o=function(t){"number"==typeof t&&(t=void 0);var l=e.data(t||i,"idleTimerObj");l.idle=!l.idle;var a=+new Date-l.olddate;if(l.olddate=+new Date,l.idle&&d.timeout>a)return l.idle=!1,clearTimeout(e.idleTimer.tId),d.enabled&&(e.idleTimer.tId=setTimeout(o,d.timeout)),void 0;var m=e.Event(e.data(i,"idleTimer",l.idle?"idle":"active")+".idleTimer");e(i).trigger(m)},m=function(e){var t=e.data("idleTimerObj")||{};t.enabled=!1,clearTimeout(t.tId),e.off(".idleTimer")};if(a.olddate=a.olddate||+new Date,"number"==typeof t)d.timeout=t;else{if("destroy"===t)return m(l),this;if("getElapsedTime"===t)return+new Date-a.olddate}l.on(e.trim((d.events+" ").split(" ").join(".idleTimer ")),function(){var t=e.data(this,"idleTimerObj");clearTimeout(t.tId),t.enabled&&(t.idle&&o(this),t.tId=setTimeout(o,t.timeout))}),a.idle=d.idle,a.enabled=d.enabled,a.timeout=d.timeout,d.startImmediately&&(a.tId=setTimeout(o,a.timeout)),l.data("idleTimer","active"),l.data("idleTimerObj",a)},e.fn.idleTimer=function(t,i){return i||(i={}),this[0]&&e.idleTimer(t,this[0],i),this}})(jQuery);
