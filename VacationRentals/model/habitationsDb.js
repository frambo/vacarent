var db;
var nextID;

require("../model/g05util").getData(
  require('path').resolve(__dirname, '../public/data/habitationsDb.json'),
  function (jsonResult) {
    db = jsonResult.data;
    nextID = jsonResult.nextId;
    db.forEach(function (item) {
      var featuredPhoto = "", featuredPhotoThumbnail = "",
        photoAlbum = [], photoThummnailAlbum = [];
      if (typeof item.imagesSource != 'undefined' && item.imagesSource === 'flickr') {
        var featuredPhotoBody = typeof item.flickr.featuredPhoto != 'undefined' ? item.flickr.featuredPhoto : item.flickr.album[0];
        featuredPhoto = item.flickr.parts.urlbase + featuredPhotoBody + item.flickr.parts.image;
        featuredPhotoThumbnail = item.flickr.parts.urlbase + featuredPhotoBody + item.flickr.parts.thumbnail;
        item.flickr.album.forEach(function (imageBody) {
          photoAlbum.push(item.flickr.parts.urlbase + imageBody + item.flickr.parts.image);
          photoThummnailAlbum.push(item.flickr.parts.urlbase + imageBody + item.flickr.parts.thumbnail);
        });
      } else {
        var featuredPhotoBody = typeof item.photos.featuredPhoto != 'undefined' ? item.photos.featuredPhoto : item.photos.album[0];
        featuredPhoto = '/images/habitations/' + item.id + '/' + featuredPhotoBody;
        featuredPhotoThumbnail = '/images/habitations/' + item.id + '/thumbnails/' + featuredPhotoBody;
        item.photos.album.forEach(function (photo) {
          photoAlbum.push('/images/habitations/' + item.id + '/' + photo);
          photoThummnailAlbum.push('/images/habitations/' + item.id + '/thumbnails/' + photo);
        });
      }
      item['gallery'] = {
        "featuredPhoto": featuredPhoto,
        "featuredPhotoThumbnail": featuredPhotoThumbnail,
        "photoAlbum": photoAlbum,
        "photoThumbnailAlbum": photoThummnailAlbum
      };
      item['detailsPage'] = '/habitation/' + item.id;
    });
  }
);

module.exports.allHabs = function (callback) {
  process.nextTick(function () {
    var ret = [];
    for (var i = 0; i < db.length; ++i) {
      if (db[i])
        ret.push(db[i]);
    }
    callback(null, ret);
  });
}

module.exports.addNew = function (newHab, done) {
  newHab["id"] = nextID++;
  db[newHab["id"] - 1] = newHab;
  done(null, newHab);
}

module.exports.addNewComment = function (habId, comment, done) {
  if (!db[habId - 1]) {
    done('ixexistent');
  }
  db[habId - 1].comments.push(comment);
  done(null, db[habId - 1].comments);
}


module.exports.getHab = function (habId, done) {
  process.nextTick(function () {
    done(null, db[habId - 1]);
  });
}

module.exports.getByUser = function (userId, callback) {
  process.nextTick(function () {
    var ret = [];
    for (var i = 0; i < db.length; ++i) {
      if (db[i] && db[i].owner && (db[i].owner === userId))
        ret.push(db[i]);
    }
    callback(null, ret);
  });
}

module.exports.deleteHab = function (habId, userID, done) {
  process.nextTick(function () {
    if (db[habId - 1].owner && (db[habId - 1].owner === userID)) {
      db[habId - 1] = null;
      return done(null);
    }
    else {
      done('user inst the owner');
    }
  });
}

