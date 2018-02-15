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

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const session = require('express-session');
const passport = require('passport');
const routes = require('./lib/routes');
const debug = require('debug')('guestlister');
const config = require('./config/config');

const app = express();
const mongojs = require('mongojs');
const mongoose = require('mongoose');
const backoff = require('backoff');
const MongoStore = require('connect-mongodb-session')(session);

// use ES6 promises for mongoose
mongoose.Promise = global.Promise;

const dbURI = config.mongo.location + config.mongo.database;
mongoose.connect(dbURI, {
    promiseLibrary: global.Promise // use ES6 promises for underlying MongoDB DRIVE
});
mongoose.connection.on('error', (err) => {
    debug('Could not connect to MongoDB @ %s: %s', dbURI, err);
});
// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        debug('Mongoose default connection disconnected through app termination signal (SIGINT)');
        process.exit(0);
    });
});

// Passport configuration
require('./lib/auth');

function initApp(callback) {
    debug('Initialize application');

    // Express configuration
    app.set('view engine', 'ejs');
    app.use(express.static(__dirname + '/css'));
    app.use(cookieParser());
    app.use(bodyParser.json({ extended: false }));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(errorHandler());
    // todo check if guestlister has to use same session as bouncer
    app.use(session({ secret: config.sessionsecret, resave: false, saveUninitialized: false }));
    app.use(passport.initialize());
    app.use(passport.session());

    // Routes
    app.get('/', routes.site.index);
    app.get('/login', routes.site.loginForm);
    app.post('/login', routes.site.login);
    app.get('/logout', routes.site.logout);

    app.get(config.oauth.authorizationPath, routes.oauth2.authorization);
    app.post(config.oauth.tokenPath, routes.oauth2.token);

    //Create test users in database
    debug('Creating test users: %O', config.testUsers);
    // todo clear sessions/users on start?

    const db = mongojs('localhost/' + config.mongo.database, ['users', 'sessions']);

    function saveUserAsync(user) {
        return new Promise(function(resolve, reject) {
            db.users.save(user, function (err, doc) {
                if (err) {
                    return reject(err);
                }
                return resolve([doc]);
            });
        });        }

    const authoruser = {
        '_id': '58a2e0ea1d68491233b925e8',
        'orcid': config.testUsers[0].orcid,
        'lastseenAt': new Date(),
        'level': config.testUsers[0].level,
        'name': config.testUsers[0].name
    };

    const editoruser = {
        '_id': '598438375a2a970bbd4bf4fe',
        'orcid': config.testUsers[1].orcid,
        'lastseenAt': new Date(),
        'level': config.testUsers[1].level,
        'name': config.testUsers[1].name
    };

    const adminuser = {
        '_id': '5887181ebd95ff5ae8febb88',
        'orcid': config.testUsers[2].orcid,
        'lastseenAt': new Date(),
        'level': config.testUsers[2].level,
        'name': config.testUsers[2].name
    };

    Promise.all([saveUserAsync(authoruser), saveUserAsync(editoruser), saveUserAsync(adminuser)])
        .then(function(allData) {
            debug('Successfully added test users to the database %s', config.mongo.database);
            try {
                app.listen(config.net.port, () => {
                    debug('guestlister %s with API version %s waiting for requests on port %s',
                        config.version,
                        config.api_version,
                        config.net.port);
                });

            } catch (err) {
                callback(err);
            }
        });

    callback(null);
}

// auto_reconnect is on by default and only for RE(!)connects, BUT not for the initial attempt: http://bites.goodeggs.com/posts/reconnecting-to-mongodb-when-mongoose-connect-fails-at-startup/
const dbBackoff = backoff.fibonacci({
    randomisationFactor: 0,
    initialDelay: config.mongo.initial_connection_initial_delay,
    maxDelay: config.mongo.initial_connection_max_delay
});

dbBackoff.failAfter(config.mongo.initial_connection_attempts);
dbBackoff.on('backoff', function (number, delay) {
    debug('Trying to connect to MongoDB in %sms', delay);
});
dbBackoff.on('ready', function (number, delay) {
    debug('Connect to MongoDB (#%s) ...', number);
    mongoose.connect(dbURI, {
        promiseLibrary: global.Promise
    }, (err) => {
        if (err) {
            debug('Error during connect: %s', err);
            mongoose.disconnect(() => {
                debug('Mongoose: Disconnected all connections.');
            });
            dbBackoff.backoff();
        } else {
            // delay app startup to when MongoDB is available
            debug('Initial connection open to %s: %s', dbURI, mongoose.connection.readyState);
            initApp((err) => {
                if (err) {
                    debug('Error during init!\n%s', err);
                    mongoose.disconnect(() => {
                        debug('Mongoose: Disconnected all connections.');
                    });
                    dbBackoff.backoff();
                }
                debug('Started application.');
            });
        }
    });
});
dbBackoff.on('fail', function () {
    debug('Eventually giving up to connect to MongoDB'.red);
    process.exit(1);
});

dbBackoff.backoff();