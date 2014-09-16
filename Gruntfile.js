/*global module*/

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/**\n * <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> - v<%= pkg.version %>\n * <%= pkg.description %>\n * <%= pkg.homepage %>\n * <%= pkg.license %>\n */\n'
            },
            build: {
                src: 'src/fingerprint.js',
                dest: 'dist/fingerprint.min.js'
            }
        }
    });

    // Load plugins.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Default task(s).
    grunt.registerTask('default', ['uglify']);
};