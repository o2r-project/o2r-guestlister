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
const backoff = require('backoff');

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
    app.use(session({ secret: config.sessionsecret, resave: false, saveUninitialized: false }));
    app.use(passport.initialize());
    app.use(passport.session());

    //Create test users in database
    //todo: wait for async to complete
    if (config.createUserOnStartup) {
        debug('Creating test users: %O', config.testUsers);

        const db = mongojs('localhost/muncher', ['users', 'sessions']);

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
                // All data available here in the order it was called.
            });

    } else {
        debug('Starting guestlister without creating test users')
    }

    // Routes
    app.get('/', routes.site.index);
    app.get('/login', routes.site.loginForm);
    app.post('/login', routes.site.login);
    app.get('/logout', routes.site.logout);

    app.get('/oauth/authorize', routes.oauth2.authorization);
    app.post('/oauth/token', routes.oauth2.token);

    try {
        app.listen(config.net.port, () => {
            debug('bouncer %s with API version %s waiting for requests on port %s',
                config.version,
                config.api_version,
                config.net.port);
            debug('new users get the level %s', config.user.level.default);
        });

    } catch (err) {
        callback(err);
    }

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
        useMongoClient: true,
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

//app.listen(process.env.PORT || 8383);
