var pagePayloadLength = 4; // Number of items to display per page Ajax

module.exports = { init: configureRoutes }

var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');

function configureRoutes(app) {
  app.get('/habitations/?', habitationsListAjax); // Visualização paginada da lista de imóveis (com informação resumida - sem detalhe)
  app.get('/habitationsAjax', habitationsListAjaxResponse); // Processamento da resposta da página pedida
  app.get('/habitations/:page/?', habitationsList); // Visualização paginada da lista de imóveis (com informação resumida - sem detalhe)
  app.get('/habitation/add/?', addhabitationForm); // Adicionar um imóvel
  app.post('/habitation/add/?', processAddhabitation); // Adicionar um imóvel
  app.get('/habitation/:id/?', habitationDetails); // Visualizar detalhes do imóvel
  app.get('/habitations/:id/delete?', habitationDelete);
  app.get('/myHabs/?',habitationsMy);
  app.get('/myHabs/:page',habitationsMy);
}

var habitations = require('../model/habitationsDb');

function habitationsList(req, res) {
  habitations.allHabs(function (err, data) {

    if (err) {
      console.error(err);
      throw err;
    }

    var habitationsList = data;
    var pagePayload = pagePayloadLength;
    var lastPage = Math.ceil(habitationsList.length / pagePayload);
    var pageToPresent = req.params['page'].valueOf();

    if (isNaN(pageToPresent) || pageToPresent < 0 || pageToPresent > lastPage) {
      res.redirect('/ups');
    }

    res.render('habitationsListView', {
      activeMenu: 'habitations',
      logged: req.user,
      habitationsList: habitationsList,
      habitationsPageUrlPrefix: '/habitations/',
      habitationDetailUrlPrefix: '/habitation/',
      habitationsImagesUrlPrefix: '/images/habitations/',
      habitationsThumbnails: '/thumbnails/',
      pagePayload: pagePayload,
      pageToPresent: pageToPresent,
      lastPage: lastPage
    });
  });
}

function habitationsMy(req, res) {
  if (!req.user)
    return res.redirect('/signin');

  habitations.getByUser(req.user.id, function (err, data) {
    if (err) {
      console.error(err);
      throw err;
    }
    var pagePayload = pagePayloadLength;
    var lastPage = Math.ceil(data.length / pagePayload);
    var pageToPresent = 0;
    var isntLast = true;
    if (req.params['page']){

      pageToPresent= req.params['page'].valueOf();
    }
    else{
      pageToPresent = 1;
    }
    var start = (pageToPresent-1)*pagePayloadLength;

    var habitationsList = data.slice(start,start+pagePayloadLength);

    if ( pageToPresent >= lastPage) {
      pageToPresent=lastPage;
      isntLast = false;
    }


    res.render('myhabitationsView', {
      activeMenu: 'habitations',
      logged: req.user,
      habitationsList: habitationsList,
      habitationsPageUrlPrefix: '/habitations/',
      habitationDetailUrlPrefix: '/habitation/',
      habitationsImagesUrlPrefix: '/images/habitations/',
      habitationsThumbnails: '/thumbnails/',
      pagePayload: pagePayload,
      pageToPresent: pageToPresent,
      hasMore: isntLast
    });
  });
}

function habitationsListAjax(req, res) {
  res.render('habitationsListViewAjax', {
    activeMenu: 'habitations',
    logged: req.user
  });
}

function habitationsListAjaxResponse(req, res) {
  habitations.allHabs(function (err, habitationsList) {
    var targetDisplayPage = req.query['page'];
    var lastPage = Math.ceil(habitationsList.length / pagePayloadLength);

    if (targetDisplayPage < 0 || targetDisplayPage > lastPage) { // ToDo: Uniformizar error handling para throw
      this.emit(new Error("Target page out of bounds."));
    }

    var pagePayload = [];
    var habitationsListOffset = (targetDisplayPage - 1) * pagePayloadLength;
    for (var item = habitationsListOffset; item < Math.min(habitationsListOffset + pagePayloadLength, habitationsList.length); item++) {
      pagePayload.push(habitationsList[item]);
    }
    var pageData = {};
    pageData['data'] = pagePayload;
    pageData['pageInfo'] = {'current': targetDisplayPage, 'total': lastPage}
    res.send(pageData);
  });
}

function habitationDetails(req, res) {
  habitations.getHab(req.params.id, function (err, data) {
    if (err) {
      console.error(err);
      throw err;
    }
    var hab = data;
    res.render('habitationDetailedViewG05', {
      activeMenu: 'habitations',
      logged: req.user,
      hideSearch: true,
      id: req.params.id,
      habitation: hab
    });
  });
}

function habitationDelete(req, res) {
  if (!req.user)
    return res.redirect('/signin');
  habitations.deleteHab(req.params.id, req.user.id, function (err, success) {
    if (err) {
      res.redirect('/signout');
    }
    else {
      res.redirect('/');
    }
  });
}


function addhabitationForm(req, res) {
  if (!req.user)
    return res.redirect('/signin');
  res.render('habitationAddView', {
    activeMenu: 'habitations', hideSearch: true, logged: req.user
  })
}

function processAddhabitation(req, res) {
  if (!req.user)
    return res.redirect('/signin');

  var newHab = {
    owner: req.user,
    name: req.body.name,
    summary: req.body.summary,
    description: req.body.description,
    photos: {
      featuredPhoto: "",
      album: []
    },
    weeklyFee: req.body.weeklyFee,
    location: {
      local: req.body.local,
      gps: {
        latitude: req.body.latitude,
        longitude: req.body.longitude
      }
    },
    characteristics: {
      capacity: req.body.capacity,
      area: req.body.area,
      rooms: req.body.rooms,
      bedrooms: req.body.bedrooms,
      amenities: req.body.amenities + req.body.disabledFacilities + req.body.pets
    },
    comments: [],
    availability: processAvailability(req.body.availability)
  };

  habitations.addNew(newHab, function (err, addedHab) {
    if (err) {
      console.error(err);
      throw err;
    }

    processImages(addedHab, function (err) {
      if (err) {
        console.error(err);
        throw err;
      }
      res.redirect('/habitation/' + addedHab.id);
    });
  });

  function processImages(addedHab, callback) {
    var thumbnailPath = path.resolve(__dirname, '..', 'public', 'images', 'habitations', '' + addedHab.id, 'thumbnails');

    mkdirp(thumbnailPath, function (err) {
      if (err) {
        callback(err);
      }
      else {
        processPhotos(thumbnailPath, function (err) {
          if (err)
            callback(err);

          require('fs-extra').copy(thumbnailPath, path.resolve(thumbnailPath, '..'), function (err) {
            callback(err);
          });
        });
      }
    });
  }


  function processPhotos(destinationPath, callback) {
    processPhoto(destinationPath, req.files["featuredPhoto"], 'featured.jpg', function (err) {
      if (err)
        throw err;
      newHab.photos.featuredPhoto = 'featured.jpg';
    });
    var j = 1;
    for (var i in req.files) {
      if (req.files[i].size > 0 && req.files[i].fieldName != 'featuredPhoto') {
        var picName = j + '.jpg';
        j++;
        processPhoto(destinationPath, req.files[i], picName, function (err) {
          if (err)
            throw err;
        });
        newHab.photos.album.push(picName);
      }
    }
    callback(null);
  }

  function processPhoto(thumbnailPath, photoPath, newName, callback) {
    if (path.extname(photoPath.name).toLowerCase() === '.jpg' &&
      (photoPath.type === 'image/jpeg')) {
      fs.rename(photoPath.path, path.resolve(thumbnailPath, newName), function (err) {
        if (err) {
          callback(err);
        }
        callback(null);
      });
    }
    else {
      fs.unlink(photoPath.path, function (err) {
        if (err) {
          callback(err);
        }
      });
    }
  }

  function processAvailability(formData) {
    var res = [];
    if (!formData) {
      return res;
    }

    var years = formData.split("\n");
    for (var i = 0; i < years.length; ++i) {
      var year = years[i].split(/,| |;|:|\r/g);
      var ano = year[0];
      if (!ano.match(/\d{4}/)) {
        return 'anoInvalido';
      }

      var weeks = [];
      for (var i = 1; i < year.length; ++i) {
        if (year[i] > 0 && year[i] < 53) {
          weeks.push(year[i]);
        }
      }

      var obj = {};
      obj[ano] = weeks;
      res.push(obj);
    }
    return res;
  }

}