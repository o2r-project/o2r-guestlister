'use strict';

const clients = [
  { id: '3', name: 'o2rtest', clientId: 'APP-8XINMK52KZVU', clientSecret: '2afa48e4-9473-446f-88bd', isTrusted: true }
];


module.exports.findById = (id, done) => {
  for (let i = 0, len = clients.length; i < len; i++) {
    if (clients[i].id === id) return done(null, clients[i]);
  }
  return done(new Error('Client Not Found'));
};

module.exports.findByClientId = (clientId, done) => {
  for (let i = 0, len = clients.length; i < len; i++) {
    if (clients[i].clientId === clientId) return done(null, clients[i]);
  }
  return done(new Error('Client Not Found'));
};
