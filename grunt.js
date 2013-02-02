module.exports = function(grunt) {

  grunt.initConfig( {
    pkg: grunt.file.readJSON('package.json'),

    forever: {
      main: "tvine.js"
    },
    min: {
      dist: {
        src:['public/js/vendor/modernizr-2.6.1.min.js',
        'public/js/vendor/video.js',
        'public/js/vendor/mustache.js',
        'public/js/vendor/underscore.js',
        'public/js/vendor/signals.min.js',
        'public/js/vendor/crossroads.min.js',
        'public/js/vendor/hasher.min.js',
        'public/js/templates.js',
        'public/js/plugins.js',
        'public/js/main.js'],

        dest:'public/js/tvine-min.js'
      }
    },
    watch: {
      jsfiles: {
        files: "public/js/!(tvine-min).js",
        tasks: [ "min:dist" ],
        options: {
          interrupt: true
        }
      },
      less: {
        files: "public/**/*.less",
        tasks: [ "less" ],
        options: {
          interrupt: true
        }
      },
      mustache: {
        files: "public/js/templates/**/*.mustache",
        tasks: [ "template" ],
        options: {
          interrupt: true
        }
      },
      nodeapp: {
        files: "tvine.js",
        tasks: [ "forever:stop", "forever:start" ],
        options: {
          interrupt: true
        }
      }
    },

    less: {
      development: {
        options: {},
        files: {
          "public/css/main.css" : "public/css/main.less"
        }
      }
    },

    template: {
      development: {
        src: 'public/js/templates/**/*.mustache',
        dest: 'public/js/templates.js',
        variables: {
          name: 'TMPL',
          staticPath: 'js/templates'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-jstemplater');
  grunt.loadNpmTasks('grunt-forever');

  grunt.registerTask("build", ["less", "min", "template"]);

  grunt.registerTask("run",
    [ "forever:stop",
      "forever:start",
      "min",
      "watch"]);
  grunt.registerTask("default", "run");
};
