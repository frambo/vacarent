module.exports.init = function configureRoutes(app) {
  app.get('/', showHome);
  app.get('/ups', ups);
}

var fs = require('fs')
  , carouselList = null;

fs.readdir('./public/images/carousel', function (err, files) {
  if (err) {
    console.error(err);
    throw err;
  }
  carouselList = files;
  return;
});

function ups(req, res) {
  res.render('urlNotFound', {
    title: 'Ups!',
    activeMenu: 'home',
    logged: req.user
  });
}

function showHome(req, res) {
  var loggedUser = null;

  if (req.user) {
    loggedUser = req.user.username;
  }

  require("../model/g05util").getData(
    require('path').resolve(__dirname, '../public/data/homeDb.json'),
    function (jsonResult) {
      jsonResult['activeMenu'] = 'home';
      jsonResult['logged'] = req.user;
      //jsonResult['hideSearch'] = true;
      res.render('homeView', jsonResult);
    }
  );
};
