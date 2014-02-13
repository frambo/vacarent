module.exports = { init: configureRoutes }

function configureRoutes(app) {
  app.get('/about/?', showAbout);
}

function showAbout(req, res) {
  require("../model/g05util").getData(
    require('path').resolve(__dirname, '../public/data/aboutDb.json'),
    function (jsonResult) {
      jsonResult['activeMenu'] = 'showAbout';
      jsonResult['logged'] = req.user;
      jsonResult['hideSearch'] = true;
      res.render('aboutView', jsonResult);
    }
  );
};
