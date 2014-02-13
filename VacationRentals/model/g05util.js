module.exports.getData = function (filePath, callback) {
  require('fs').readFile(filePath, 'utf8', function (err, data) {
    if (err) {
      console.error(err);
      throw err;
    }
    callback(JSON.parse(data));
  });
};

