const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const session = require('express-session');
const passport = require('passport');
const routes = require('./lib/routes');
const debug = require('debug')('guestlister');
const config = require('./config/config');

// Express configuration
const app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/css'));
app.use(cookieParser());
app.use(bodyParser.json({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(errorHandler());
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
require('./lib/auth');

// Routes
app.get('/', routes.site.index);
app.get('/login', routes.site.loginForm);
app.post('/login', routes.site.login);
app.get('/logout', routes.site.logout);

app.get('/oauth/authorize', routes.oauth2.authorization);
app.post('/oauth/token', routes.oauth2.token);

app.listen(process.env.PORT || 8383);
