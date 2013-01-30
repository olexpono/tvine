module.exports = function(grunt) {

  grunt.initConfig( {
    pkg: grunt.file.readJSON('package.json'),

    forever: {
      main: "tvine.js"
    },

    watch: {
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

  grunt.registerTask("build", ["less", "template"]);

  grunt.registerTask("run",
    [ "forever:stop",
      "forever:start",
      "watch"]);
  grunt.registerTask("default", "run");
};
