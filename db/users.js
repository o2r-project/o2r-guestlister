'use strict';

const users = [
  { id: '1', username: 'o2r-admin', password: 'admin', name: 'Adi Admin', orcid: '0000-0002-1701-2564' },
  { id: '2', username: 'o2r-editor', password: 'editor', name: 'Edd Editor', orcid: '0000-0001-5930-4867' },
  { id: '2', username: 'o2r-author', password: 'author', name: 'Augusta Authora', orcid: '0000-0001-6225-344X' },
];

module.exports.findById = (id, done) => {
  for (let i = 0, len = users.length; i < len; i++) {
    if (users[i].id === id) return done(null, users[i]);
  }
  return done(new Error('User Not Found'));
};

module.exports.findByUsername = (username, done) => {
  for (let i = 0, len = users.length; i < len; i++) {
    if (users[i].username === username) return done(null, users[i]);
  }
  return done(new Error('User Not Found'));
};
