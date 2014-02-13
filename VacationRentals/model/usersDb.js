module.exports = {
  getById: getUserById, getByUsername: getUserByUsername, getByEmail: getUserByEmail, checkPassword: checkUserPassword, resetPassword: resetUserPassword, add: addUser, findOne: findOne
};

var usersDb = module.exports.users = [
  { id: 1, username: 'tiagoabrito@gmail.com', password: 'tiago', email: 'tiagoabrito@gmail.com', active: true
  }
  ,
  { id: 2, username: 'carlos', password: 'carlos', email: 'carlosmmarques@gmail.com', active: true
  }
  ,
  { id: 3, fbId: '100000320885159', username: 'abs@ggl.pt', password: 'antonio', email: 'abs@ggl.pt', active: true
  }
];

function getUserById(id, callback) {
  var idx = id - 1;
  if (usersDb[idx]) {
    callback(null, usersDb[idx]);
  } else {
    callback(new Error('User ' + id + ' does not exist'));
  }
}

function getUserByUsername(username, callback) {
  for (var i = 0, len = usersDb.length; i < len; i++) {
    var user = usersDb[i];
    if (user.username === username) {
      return callback(null, user);
    }
  }
  return callback(null, null);
}


function getUserByEmail(username, callback) {
  usersDb.forEach(function (user) {
    if (user.email === username) {
      callback(null, user);
    }
  });
  callback(null, null);
}

function checkUserPassword(username, password, callback) {
  usersDb.forEach(function (user) {
    if (user.username === username) {
      if (user.password === password) {
        callback(null);
      }
      callback('password doesn\'t match');
    }
  });
  callback('username not found');
}

function resetUserPassword(username, callback) {
  usersDb.forEach(function (user) {
    if (user.username === username) {
      var newPassword = 'hastalavistababy';
      user.password = newPassword;
      callback(null, newPassword);
    }
  });
  callback('username not found', null);
}

function addUser(newUser, callback) {
  if (!newUser.username || newUser.username === '') {
    callback('no username supplied');
  }
  if (!newUser.password || newUser.password === '') {
    callback('empty password is not allowed');
  }
  var id = 0;
  usersDb.forEach(function (user) {
    if (user.username === newUser.username) {
      callback('duplicate username');
    }
    if (user.id > id) {
      id = user.id + 1;
    }
  });
  newUser['id'] = id;
  usersDb[usersDb.length] = newUser;
  callback(null, newUser);
}

function findOne(userInfo, callback) {

  for (var i = 0, len = usersDb.length; i < len; i++) {
    var user = usersDb[i];
    for (var key in userInfo) {
      if (user[key] === userInfo[key]) {
        return callback(null, user);
      }
    }
  }
  return callback(null, null);
}