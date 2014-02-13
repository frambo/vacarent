var http = require('http');
var express = require('express');
var path = require('path');
var flash = require('connect-flash');
var passport = require('passport');

var app = express();
var LocalStrategy = require('passport-local').Strategy;

app.locals({
  title: 'vacaRent', logo: 'vacaIcon', author: 'LI51N - G05 (ABS + CM + TB)', gravatar: require("gravatar"), user: null
});

app.configure(function () {
  // --- set
  app.set('port', process.env.PORT || 3000);
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  // --- use
  app.use(express.logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'LI51N-G05' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  app.use(app.router);
  app.use(express.directory(__dirname + '/public')); // ABS prettify - must be after app.router
  // --- Static paths
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, 'bower_components')));
  app.use(express.static(path.join(__dirname, 'bower_components/twitter/dist')));
  app.use(function (err, req, res, next) {
    console.error('>>> G05 says: Ups! An error occurred <<<');
    next(err);
  });
});

app.configure('dev', function () {
  app.use(express.errorHandler());
});

require('./routes/init').configure(app);

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
