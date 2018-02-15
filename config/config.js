/*
 * (C) Copyright 2018 o2r project.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
const yn = require('yn');

var c = {};
c.version = {};
c.net = {};
c.mongo = {};
c.oauth = {};
var env = process.env;

// Information about guestlister
c.api_version = 1;
c.version = require('../package.json').version;

// network & database
c.net.port         = env.GUESTLISTER_PORT || 8083;
c.net.host         = 'http://localhost:';
c.mongo.location   = env.GUESTLISTER_MONGODB || 'mongodb://localhost/';
c.mongo.database   = env.GUESTLISTER_MONGODB_DATABASE || 'muncher';
c.mongo.initial_connection_attempts = 30;
c.mongo.initial_connection_max_delay = 3000;
c.mongo.initial_connection_initial_delay = 1000;

// fix mongo location if trailing slash was omitted
if (c.mongo.location[c.mongo.location.length-1] !== '/') {
    c.mongo.location += '/';
}

// oauth providers
c.oauth.default = {
    authorizationURL: env.OAUTH_URL_AUTHORIZATION || c.net.host + c.net.port + '/api/v1/oauth/authorize',
    tokenURL: env.OAUTH_URL_TOKEN || c.net.host + c.net.port + '/api/v1/oauth/token',
    callbackURL: env.OAUTH_URL_CALLBACK || c.net.host + c.net.port + '/api/v1/auth/login',
    clientID: env.OAUTH_CLIENT_ID,
    clientSecret: env.OAUTH_CLIENT_SECRET,
    scope: env.OAUTH_SCOPE || '/authenticate'
};

// session secret
c.sessionsecret = env.SESSION_SECRET || 'o2r';

// user levels
c.users = {};
c.user.level = {};
c.user.level.admin = 1000;
c.user.level.editor = 500;
c.user.level.known = 100;
c.user.level.userEdit = c.user.level.editor;

// test users
c.testUsers = [
    { id: '1', username: 'o2r-admin', password: 'secretadmin3', name: 'Adi Admin', orcid: '0000-0002-1701-2564', level: 1000 },
    { id: '2', username: 'o2r-editor', password: 'secreteditor2', name: 'Edd Editor', orcid: '0000-0001-5930-4867', level: 500 },
    { id: '3', username: 'o2r-author', password: 'secretauthor1', name: 'Augusta Authora', orcid: '0000-0001-6225-344X', level: 500 },
];

// startup behavior
c.createUserOnStartup = yn(env.CREATE_USERS_ON_STARTUP) || true;

module.exports = c;