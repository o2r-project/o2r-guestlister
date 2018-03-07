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
const path = require('path');

const app = express();
const mongojs = require('mongojs');
const mongoose = require('mongoose');
const backoff = require('backoff');
const MongoStore = require('connect-mongodb-session')(session);
const signature = require('cookie-signature');

// mongo connection
const dbURI = config.mongo.location + config.mongo.database;
// see http://blog.mlab.com/2014/04/mongodb-driver-mongoose/#Production-ready_connection_settings and http://mongodb.github.io/node-mongodb-native/2.1/api/Server.html and http://tldp.org/HOWTO/TCP-Keepalive-HOWTO/overview.html
let dbOptions = {
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    keepAlive: 30000,
    socketTimeoutMS: 30000,
    promiseLibrary: mongoose.Promise // use ES6 promises for mongoose
};
mongoose.connection.on('error', (err) => {
    debug('Could not connect to MongoDB @ %s: %s', dbURI, err);
});
// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        debug('Mongoose default connection disconnected through app termination signal (SIGINT)');
        process.exit(0);
    });
    db.close();
});

mongoStringSplit = config.mongo.location.split('mongodb://');
host = mongoStringSplit[mongoStringSplit.length - 1];
debug('Connecting to host %s to write test users into database and to get session cookies', host);
const db = mongojs(host + config.mongo.database, ['users', 'sessions']);

// Passport configuration
require('./lib/auth');

// Helper function to expose the cookies publicly for testing
getCookiePublicly = (req, res) => {
    let userId = req.params.userId;

    // get the latest session for the user
    db.sessions
        .find({ "session.passport.user": userId })
        .sort({ expires: -1 }, (err, doc) => {
            if (err) {
                debug('Error finding session for user %s: %o', userId, err);
                res.status(500).send(err);
            }
            if (doc.length < 1) {
                debug('No session found for %s', userId);
                res.status(400).send({ error: "no session found for user " + userId });
            } else {
                // calculate cookie string https://github.com/expressjs/session/blob/5c04910e1a10a7ca4cdeb05f4e4d5d43e9533e0c/index.js#L631
                signed_cookie = 's:' + signature.sign(doc[0]._id.toString(), config.sessionsecret_bouncer);

                debug('Returning cookie for user %s: %s', userId, signed_cookie);
                res.status(200).send({ cookie: signed_cookie, user: userId });
            }
        });

}


function initApp(callback) {
    debug('Initialize application');

    const mongoStore = new MongoStore({
        uri: config.mongo.location + config.mongo.database,
        collection: 'guestlist'
    }, err => {
        if (err) {
            debug('Error starting MongoStore: %s'.red, err);
        }
    });

    mongoStore.on('error', err => {
        debug('Error with MongoStore: %s'.red, err);
    });

    // Express configuration
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    debug('Setting views directory to %s', path.join(__dirname, 'views'));
    app.use('/oauth/css', express.static(path.join(__dirname, 'css')));
    app.use(cookieParser());
    app.use(bodyParser.json({ extended: false }));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(errorHandler());
    app.use(session({ secret: config.sessionsecret, resave: false, saveUninitialized: false, store: mongoStore }));
    app.use(passport.initialize());
    app.use(passport.session());

    // Routes
    app.get('/', routes.site.index);
    app.get(config.oauth.loginPath, routes.site.loginForm);
    app.post(config.oauth.loginPath, routes.site.login);

    app.get(config.oauth.authorizationPath, routes.oauth2.authorization);
    app.post(config.oauth.tokenPath, routes.oauth2.token);

    app.get(config.cookiePath + '/:userId', getCookiePublicly);

    //Create test users in database
    debug('Creating test users: %O', config.testUsers);
    function saveUserAsync(user) {
        return new Promise(function (resolve, reject) {
            db.users.save(user, function (err, doc) {
                if (err) {
                    debug('Error saving user: %o', err);
                    return reject(err);
                }
                return resolve([doc]);
            });
        });
    }

    let promises = [];

    Object.keys(config.testUsers).forEach(function (key) {
        promises.push(saveUserAsync(config.testUsers[key]))
    });

    Promise.all(promises)
        .then(function (allData) {
            debug('Successfully added test users to the database %s', config.mongo.database);
            try {
                app.listen(config.net.port, () => {
                    debug('guestlister %s with API version %s waiting for requests on port %s',
                        config.version,
                        config.api_version,
                        config.net.port);
                });

            } catch (err) {
                debug('Error during user creation: %o', err);
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
    mongoose.connect(dbURI, dbOptions, (err) => {
        if (err) {
            debug('Error during connect: %o', err);
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