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
const url = require('url');

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
c.net.port         = env.GUESTLISTER_PORT || 8383;
c.net.bouncer_port = env.BOUNCER_PORT || 8083;
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

// oauth configuration
c.oauth.authorizationPath = env.OAUTH_URL_AUTHORIZATION ? url.parse(env.OAUTH_URL_AUTHORIZATION).pathname : '/oauth/authorize';
c.oauth.tokenPath = env.OAUTH_URL_TOKEN ? url.parse(env.OAUTH_URL_TOKEN).pathname : '/oauth/token';
c.oauth.publicScope = '/read-public';
c.oauth.loginPath = '/oauth/login';

// oauth providers
c.oauth.default = {
    authorizationURL: env.OAUTH_URL_AUTHORIZATION || c.net.host + c.net.port + c.oauth.authorizationPath,
    tokenURL: env.OAUTH_URL_TOKEN || c.net.host + c.net.port + c.oauth.tokenPath,
    callbackURL: env.OAUTH_URL_CALLBACK || c.net.host + c.net.bouncer_port + '/login',
    clientID: env.OAUTH_CLIENT_ID,
    clientSecret: env.OAUTH_CLIENT_SECRET,
    scope: env.OAUTH_SCOPE || '/authenticate'
};

// session secret
c.sessionsecret = env.SESSION_SECRET || 'guestlisterSecret';

// user levels
c.user = {};
c.user.level = {};
c.user.level.admin = 1000;
c.user.level.editor = 500;
c.user.level.known = 100;
c.user.level.userEdit = c.user.level.editor;

// test data
c.testClient =   {
    id: '3',
    name: 'o2rtest',
    clientId: c.oauth.default.clientID,
    clientSecret: c.oauth.default.clientSecret,
    isTrusted: true
};

c.testUsers = {};

c.testUsers.adminUser = {
    id: '1',
    role: 'Admin',
    username: 'o2r-admin',
    password: 'secretadmin3',
    name: 'Adi Admin',
    orcid: '0000-0002-1701-2564',
    level: c.user.level.admin,
    lastseenAt: new Date()
};

c.testUsers.editorUser = {
    id: '2',
    role: 'Editor',
    username: 'o2r-editor',
    password: 'secreteditor2',
    name: 'Edd Editor',
    orcid: '0000-0001-5930-4867',
    level: c.user.level.editor,
    lastseenAt: new Date()
};

c.testUsers.authorUser = {
    id: '3',
    role: 'User',
    username: 'o2r-author',
    password: 'secretauthor1',
    name: 'Augusta Authora',
    orcid: '0000-0001-6225-344X',
    level: c.user.level.known,
    lastseenAt: new Date()
};

module.exports = c;