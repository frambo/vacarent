var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , GoogleStrategy = require('passport-google').Strategy;

var usersDB = require('../model/usersDb');
var users = require('../model/usersDb').users;

module.exports = { init: configureRoutes }

function configureRoutes(app) {
  app.get('/signin?', signin);
  app.post('/signin', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/signin'}));

  app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
  app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/signin' }));

  app.get('/auth/google', passport.authenticate('google'));
  app.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/signin' }));

  app.get('/signout', function (req, res) {
    req.logout();
    res.redirect('/');
  });
  app.get('/register/?', registrationForm);
  app.post('/register/?', procesRegistration);
}

function signin(req, res) {
  res.render('signin', {
    activeMenu: 'home', logged: req.user, hideSearch: true, message: ''
  });
}


passport.use(new LocalStrategy(
  function (username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      usersDB.getByUsername(username, function (err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, { message: 'Unknown user ' + username });
        }
        if (user.password != password) {
          return done(null, false, { message: 'Invalid password' });
        }
        return done(null, user);
      })
    });
  }
));

passport.use(new GoogleStrategy({
    returnURL: 'http://localhost:3000/auth/google/callback',
    realm: 'http://localhost:3000',
    stateless: true
  },
  function (identifier, profile, done) {
    usersDB.findOne({ openId: identifier, email: profile.emails[0].value}, function (err, user) {
        if (user) {
          done(err, user);
        }
        else {
          var newUser = {
            id: profile.id,
            username: profile.emails[0].value,
            email: profile.emails[0].value,
            name: profile.displayName,
            password: 'b1dlahblah#AS0123'
          };
          usersDB.add(newUser, function (err, id) {
            if (err) {
              throw err;
            }
            done(err, id);
          });
        }
      }
    );
  }
));

passport.use(new FacebookStrategy({
    clientID: "363637717111435",
    clientSecret: "478349796a940ee48ed29795b2539451",
    callbackURL: "http://localhost:3000/auth/facebook/callback/"
  },
  function (accessToken, refreshToken, profile, done) {
    usersDB.findOne({email: profile.emails[0].value}, function (err, registeredUser) {
      if (registeredUser) {
        done(null, registeredUser);
      } else {
        var newUser = {
          id: profile.id,
          username: profile.emails[0].value,
          email: profile.emails[0].value,
          name: profile.displayName,
          password: 'b1dlahblah#AS0123'
        };
        usersDB.add(newUser, function (err, addedUser) {
          if (err) {
            console.error(err);
            throw err;
          }
          done(null, addedUser);
        });
      }
    });
  }
));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  usersDB.getById(id, function (err, user) {
    if (err) {
      done(err);
    }
    done(null, user);
  });
});


function registrationForm(req, res) {
  res.render('register', {
    activeMenu: 'home', logged: req.user, hideSearch: true, message: ''
  });
}

function procesRegistration(req, res) {
  if (req.body.username && req.body.password[0] === req.body.password[1]) {
  }
  var newUser = {
    username: req.body.username,
    email: req.body.username,
    name: '',
    password: req.body.password[1]
  };

  usersDB.add(newUser, function (err, addedUser) {
    if (err) {
      throw err;
    }
    req.login(newUser, function (err) {
      if (err) {
        console.error(err);
      }
      return res.redirect('/');
    });
  });
}

