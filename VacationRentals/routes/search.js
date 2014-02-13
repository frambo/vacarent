var _ = require('underscore')._;
var util = require('util');
var querystring = require('querystring');

var events = require('events');
var emitter = new events.EventEmitter();

var modelDb = require('../model/habitationsDb');

/*
 var db = modelDb.allHabs();
 require("../model/g05util").getData(
 require('path').resolve(__dirname, '../public/data/habitationsDb.json'),
 function (jsonResult) {
 db = jsonResult.data;
 }
 );
 */

module.exports = { init: configureRoutes }

function configureRoutes(app) {
  app.get('/search/?', search);
  app.get('/searchit/?', searchit);
  app.get('/searchany/?', searchByAny);
  app.post('/searchany/?', searchByAnyAJAX);
  app.get('/searchSuggest/?', searchSuggest);
  app.get('/habitations/searchSuggest/?', searchSuggest);
  //app.get('/search/name/:name/?', searchByName); // Visualização paginada da lista de imóveis (com informação resumida - sem detalhe)
  //app.get('/search/location/:location/?', searchByLocation); // Adicionar um imóvel
  //app.get('/search/price/:from-:to/?', searchByPrice); // Adicionar um imóvel
  //app.get('/search/availability/:from-:to/?', searchByAvailability); // Visualizar detalhes do imóvel
  //app.get('/search/capacity/:num/?', searchByCapacity); // Visualizar detalhes do imóvel
}

// Ajax search handling routine
function searchSuggest(req, res) {
  modelDb.allHabs(function (err, db) {
    var filteredDb = [];
    db.forEach(function (item) {
      if (req.query['where'] === 'Name') {
        if (item.name.toLowerCase().indexOf(req.query['q'].toLowerCase()) != -1) {
          filteredDb.push(item);
        }
      }
      if (req.query['where'] === 'Location') {
        if (item.location.local.toLowerCase().indexOf(req.query['q'].toLowerCase()) != -1) {
          filteredDb.push(item);
        }
      }
      if (req.query['where'] === 'Fare') {
        if (item.weeklyFee <= req.query['q']) {
          filteredDb.push(item);
        }
      }
      if (req.query['where'] === 'Capacity') {
        if (item.characteristics.capacity == req.query['q']) {
          filteredDb.push(item);
        }
      }
      if (req.query['where'] === 'Area') {
        if (item.characteristics.area >= req.query['q']) {
          filteredDb.push(item);
        }
      }
    });
    res.send(filteredDb);
  });
}

function compareStringInString(source, target) {
  return (source.toLowerCase().indexOf(target.toLowerCase()) > -1);
};

function compareNumbersEquals(source, target) {
  return (source == target);
};

function compareNumbersSletT(source, target) {
  return (source <= target);
};

function compareNumbersSgetT(source, target) {
  return (source >= target);
};

function compareWeeklyFee(source, target) {
  values = target.split('-');
  if (values.length == 1) {
    return compareNumbersSletT(source, values[0])
  }
  return compareNumbersSgetT(source, values[0]) && compareNumbersSletT(source, values[1]);
}

function compareAvailabilitySletT(source, target) {
  if (source.year < target.year) {
    return true;
  }
  if (source.year > target.year) {
    return false;
  }
  return (source.month <= target.month);
}

function compareAvailabilitySgetT(source, target) {
  if (source.year > target.year) {
    return true;
  }
  if (source.year < target.year) {
    return false;
  }
  return (source.month >= target.month);
}

function compareAvailability(source, target) {
  if (typeof source == 'undefined') {
    return true;
  }
  var tValues = target.split('-');
  if (tValues.length == 1) {
    tValues[1] = tValues[0];
  }
  var tBeginA = tValues[0].split('w'), tEndA = tValues[1].split('w');
  var tBeginB = parseInt(tBeginA[0]) * 100 + parseInt(tBeginA[1]);
  var tEndB = parseInt(tEndA[0]) * 100 + parseInt(tEndA[1]);
  var tBegin = Math.min(tBeginB, tEndB);
  var tEnd = Math.max(tBeginB, tEndB);
  for (var i = 0; i < source.length; i++) {
    var slotA = source[i].split('w');
    var slot = parseInt(slotA[0]) * 100 + parseInt(slotA[1]);
    if (tBegin <= slot && slot <= tEnd);
    {
      return tBegin > slot || slot > tEnd;
    }
  }
  return true;
}

var searchDictionary = []; // Maps search terms to filter functions

function compare(source, target, callCompareMethod) {
  return callCompareMethod(source, target);
}

searchDictionary['unified'] = function (err, req, res, args, next) {
  if (err) {
    console.error(err);
    next(err, req, res, null, res);
  }

  var resultDb = args.data; // resulting db after filtering

  // comparison function
  var mapCompare = [];
  mapCompare['name'] = compareStringInString;
  mapCompare['location'] = compareStringInString;
  mapCompare['minWeekFee'] = compareNumbersSgetT;
  mapCompare['maxWeekFee'] = compareNumbersSletT;
  mapCompare['weeklyFee'] = compareWeeklyFee;
  mapCompare['availabilityFrom'] = compareAvailabilitySgetT;
  mapCompare['availabilityTo'] = compareAvailabilitySletT;
  mapCompare['capacity'] = compareNumbersEquals;
  mapCompare['area'] = compareNumbersSgetT;
  mapCompare['bedrooms'] = compareNumbersEquals;
  mapCompare['availability'] = compareAvailability;

  for (var keyIndex = 0; keyIndex < args.keys.length; keyIndex++) {

    // filtering loop
    var iterationDb = [];
    resultDb.forEach(function (habitation) {

      // comparison data
      var mapWhat = [];
      mapWhat['name'] = habitation.name;
      mapWhat['location'] = habitation.location.local;
      mapWhat['minWeekFee'] = habitation.weeklyFee;
      mapWhat['maxWeekFee'] = habitation.weeklyFee;
      mapWhat['weeklyFee'] = habitation.weeklyFee;
      mapWhat['availabilityFrom'] = habitation.availability;
      mapWhat['availabilityTo'] = habitation.availability;
      mapWhat['capacity'] = habitation.characteristics.capacity;
      mapWhat['area'] = habitation.characteristics.area;
      mapWhat['bedrooms'] = habitation.characteristics.bedrooms;
      mapWhat['availability'] = habitation.reservations;

      var arg = args.keys[args.keysIndex];
      if (arg != 'page' && compare(mapWhat[arg], req.query[arg], mapCompare[arg])) {
        iterationDb.push(habitation);
      }
    });
    resultDb = iterationDb;

  }
  args['data'] = resultDb;
  args.searchMap['page'](null, req, res, args, next);
}

// Search by PAGE
searchDictionary['page'] = function (err, req, res, args, next) {
  if (args.keyIndex < args.keys.length) { // Skip if it is not the last filter
    args.keyIndex += 1;
    args.searchMap[args.keys[args.keyIndex]](null, req, res, args, next);
  }

  // Setup presentation parameters
  // --- page
  if (typeof args['pageToPresent'] == 'undefined') {
    args['pageToPresent'] = 1;
    if (typeof req.query['page'] != 'undefined') {
      args['pageToPresent'] = req.query['page'].valueOf();
    }
  }
  // --- items per page
  if (typeof args['pagePayload'] == 'undefined') {
    args['pagePayload'] = 4;
  }
  // --- number of pages
  if (typeof args['lastPage'] == 'undefined') {
    args['lastPage'] = Math.ceil(args['data'].length / args['pagePayload']);
  }
  // --- page data
  var pageData = [];
  var listOffset = args['pagePayload'] * (args['pageToPresent'] - 1);
  for (var cursor = listOffset; cursor < listOffset + args['pagePayload'] && cursor < args['data'].length; cursor++) {
    pageData.push(args['data'][cursor]);
  }
  args['data'] = pageData;
  // --- search string
  var searchStringArray = [];
  Object.keys(req.query).forEach(function (key) {
    if (key !== 'page') {
      searchStringArray[key] = req.query[key];
    }
  });
  args['searchString'] = Object.keys(searchStringArray).length > 0 ? '/search?' + querystring.stringify(searchStringArray) + '&page=' : '/habitations/';
  next(null, req, res, args, res);
}

function searchCallback(err, req, res, args, next) {
  //next.send(result);
  next.render('habitationsListView', {
    activeMenu: 'habitations',
    logged: req.user,
    habitationsList: args['data'],
    habitationsPageUrlPrefix: args['searchString'],
    habitationDetailUrlPrefix: '/habitation/',
    habitationsImagesUrlPrefix: '/images/habitations/',
    habitationsThumbnails: '/thumbnails/',
    pagePayload: args['pagePayload'],
    pageToPresent: args['pageToPresent'],
    lastPage: args['lastPage']
  });
}

// Search form handling routine
function search(req, res) {
  var keys = Object.keys(req.query);

  // First, look for errors
  if (keys.length == 0) {
    throw new Error('No arguments were found in the search query string.');
    return;
  }

  // Copy original db
  /*
   var newDb = [];
   db.forEach(function (item) {
   newDb.push(item);
   });
   */

  modelDb.allHabs(function (err, db) {
    searchDictionary['unified'](
      null
      , req
      , res
      , { 'data': db, 'keys': keys, "keysIndex": 0, 'searchMap': searchDictionary
      }
      , searchCallback);
  });
}

function searchit(req, res) {
  res.redirect('/search?' + req.query['searchOn'].toLowerCase() + '=' + req.query['lookFor']);
}

function searchByAny(req, res) {
  // res.send("<h1>Search by any</h1>");

  var querys = req.query["search"];
  querys = querys.split(', ');

  var filterComb = [];

  var searchOptions = ["capacity", "area", "rooms", "bedrooms"]

  for (var i = 0; i < querys.length; i++) {
    var used = false;

    var qty = querys[i].split(' ').shift();

    if (!isNaN(qty)) {
      for (option in searchOptions) {
        if (!used && ~querys[i].indexOf(searchOptions[option])) {
          var x = new Function("hab", "return hab.characteristics." + searchOptions[option] + ">=" + qty + ";");
          filterComb.push(x);
          used = true;
        }
      }
      if (!used && ~querys[i].indexOf("max")) {
        var x = new Function("hab", "return hab.weeklyFee <=" + qty + ";");
        filterComb.push(x);
        used = true;
      }
    }
    if (!used) {
      var qry = querys[i];
      var x = new Function("hab", "return ~hab.name.toLowerCase().indexOf(\"" + querys[i] + "\") + ~hab.location.local.toLowerCase().indexOf(\"" + querys[i] + "\");");
      filterComb.push(x);
    }
  }

  modelDb.all(function (err, data) {
    if (err) return serverError(req, res);

    var filteredHabs = _(data)
      .chain()
      .filter(function (hab) {
        for (x in filterComb) {
          if (!filterComb[x](hab))
            return false;
        }
        return true;
      })

      //   .filter(function(hab){ return ~hab.name.toLowerCase().indexOf(req.body.value) +
      //                                ~hab.location.local.toLowerCase().indexOf(req.body.value);})
      .sortBy(averageComments)
      //    .sortBy(function(hab){ return hab.weeklyFee;})
      .value();


    //var pageNum = req.params.page.valueOf();
    res.render('habitationsListView', {
      activeMenu: 'habitations', data: filteredHabs, page: 1
    });
  });
}


function averageComments(hab) {
  return -average(
    _(hab.comments).map(
      function (cmt) {
        return cmt.points;
      })
  );
}

function average(arr) {
  return _.reduce(arr, function (memo, num) {
    return memo + num;
  }, 0) / arr.length;
}


function searchByAnyAJAX(req, res) {
  return searchAndRender(req, res, 'habitationsListViewAJAX');
}

function searchByAnySuggest(req, res) {
  return searchAndRender(req, res, 'habitationsListSuggestion');
}

function searchAndRender(req, res, viewName) {
  var querys = req.query.value;
  querys = querys.split(', ');

  if (req.query.page == 'undefined')
    req.query.page = 1;
  var filterComb = [];

  var searchOptions = ["capacity", "area", "rooms", "bedrooms"]

  for (var i = 0; i < querys.length; i++) {
    var used = false;

    var qty = querys[i].split(' ').shift();

    if (!isNaN(qty)) {
      for (option in searchOptions) {
        if (!used && ~querys[i].indexOf(searchOptions[option])) {
          var x = new Function("hab", "return hab.characteristics." + searchOptions[option] + ">=" + qty + ";");
          filterComb.push(x);
          used = true;
        }
      }
      if (!used && ~querys[i].indexOf("max")) {
        var x = new Function("hab", "return hab.weeklyFee <=" + qty + ";");
        filterComb.push(x);
        used = true;
      }
    }
    if (!used) {
      var qry = querys[i];
      var x = new Function("hab", "return ~hab.name.toLowerCase().indexOf(\"" + querys[i] + "\") + ~hab.location.local.toLowerCase().indexOf(\"" + querys[i] + "\");");
      filterComb.push(x);
    }
  }

  modelDb.all(function (err, data) {
    if (err) return serverError(req, res);

    var filteredHabs = _(data)
      .chain()
      .filter(function (hab) {
        for (x in filterComb) {
          if (!filterComb[x](hab))
            return false;
        }
        return true;
      })

      //   .filter(function(hab){ return ~hab.name.toLowerCase().indexOf(req.body.value) +
      //                                ~hab.location.local.toLowerCase().indexOf(req.body.value);})
      .sortBy(averageComments)
      //    .sortBy(function(hab){ return hab.weeklyFee;})
      .value();
    res.render(viewName, {
      activeMenu: 'habitations', data: filteredHabs, page: req.query.page
    });
  });
}