module.exports = (grunt)->
  grunt.initConfig
    pkg: grunt.file.readJSON "package.json"

    forever:
      options:
        index: "tvine.js"

    nodemon:
      prod:
        script: "tvine.js"

    uglify:
      options:
        mangle: false
      dist:
        files:
          'public/js/tvine-min.js' : [
            'public/js/vendor/modernizr-2.6.1.min.js',
            'public/js/vendor/video.js',
            'public/js/vendor/mustache.js',
            'public/js/vendor/underscore.js',
            'public/js/vendor/signals.min.js',
            'public/js/vendor/crossroads.min.js',
            'public/js/vendor/hasher.min.js',
            'public/js/templates.js',
            'public/js/plugins.js',
            'public/js/main.js'
          ]

    watch:
      jsfiles:
        files: "public/js/!(tvine-min).js"
        tasks: [ "uglify:dist" ]
        options:
          interrupt: true
      less:
        files: "public/**/*.less"
        tasks: [ "less" ]
        options:
          interrupt: true
      mustache:
        files: "public/js/templates/**/*.mustache"
        tasks: [ "mustache" ]
        options:
          interrupt: true

    less:
      development:
        options: {}
        files:
          "public/css/main.css" : "public/css/main.less"

    mustache:
      files:
        src: 'public/js/templates/'
        dest: 'public/js/templates.js'
        options:
          prefix: 'var TMPL = '
          postfix: ';'
          verbose: true

  grunt.loadNpmTasks('grunt-contrib-less')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-mustache')
  grunt.loadNpmTasks('grunt-nodemon')

  grunt.registerTask("build", ["less", "uglify", "mustache"])
  grunt.registerTask("launch", ["build", "nodemon:prod"])

  grunt.registerTask("run",
    [ "uglify",
      "watch"])
  grunt.registerTask("default", "run")
