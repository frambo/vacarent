module.exports.configure = initAll;

var home = require(__dirname + "/home")
  , about = require(__dirname + "/about")
  , authorization = require(__dirname + "/authorization")
  , habitations = require(__dirname + "/habitations")
  , comments = require(__dirname + "/comments")
  , search = require(__dirname + "/search")
  ;

// Routes definition
function initAll(app) {
  home.init(app);
  about.init(app);
  authorization.init(app);
  search.init(app);
  habitations.init(app);
  comments.init(app);
}

