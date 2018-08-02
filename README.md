# o2r-guestlister

[![](https://images.microbadger.com/badges/image/o2rproject/o2r-guestlister.svg)](https://microbadger.com/images/o2rproject/o2r-guestlister "Get your own image badge on microbadger.com") [![](https://images.microbadger.com/badges/version/o2rproject/o2r-guestlister.svg)](https://microbadger.com/images/o2rproject/o2r-guestlister "Get your own version badge on microbadger.com")

A Node.js OAuth2 server implementation to allow offline login with o2r-bouncer as part of the [o2r reference-implementation](https://github.com/o2r-project/reference-implementation).
For more information about OAuth2 see the OAUth2 [documentation](https://oauth.net/2/).

Based on the repository https://github.com/gerges-beshay/oauth2orize-examples and the underlying OAuth2 server implementation [oauth2orize](https://www.npmjs.com/package/oauth2orize).

Requirements:

- nodejs `>= 6.2`
- npm

**Important Note:** this server is _not for production_ but only for development and demonstration, because it exposes passwords (in the config file) and private session cookies via API.

## Endpoints

The Oauth2 server implementation allows trying out the o2r reference-implementation without going through the [ORCID](https://orcid.org/) app registration. It implements the following endpoints:

* `/oauth/authorize` Starts an authorization request granting an authorization code.
* `/oauth/login` User login: Allows to chose between three different uses with basic, advanced and admin rights.
* `/oauth/token` Exchange an authorization code for an access token.
* `/oauth/cookies/<user id>` Retrieve the session cookie of test users for automatic upload.

To mimic the ORCID OAuth2 implementation the demo server submits the `username` and `ORCID` ID as custom parameters in the response to the access token request.

## Demo data

The service creates three test users when starting the service:
 
* A basic user with level `100`,
* an editor with level `500`,
* and an admin with level `1000`.

The levels are explained in the [o2r-web-api entry on user levels](http://o2r.info/o2r-web-api/user/#user-levels).

The demo data makes exploration of the o2r platform with different user roles possible.
It can be configured by editing the `testUsers` object in `config/config.js`.

## Dockerfile

This project includes a `Dockerfile` which can be built and run with

```bash
docker build -t guestlister .
docker run --rm -it -e DEBUG=* guestlister
```

## Environment variables

*To ensure the guestlister allows offline login, these values have to match the  the [o2r-bouncer](https://github.com/o2r-project/o2r-bouncer#available-environment-variables) configuration, i.e. the client ID, client secret, mongodb configuration and the oauth URLs have to be the same.*

* `GUESTLISTER_PORT`
  Define on which port guestlister should listen. Defaults to `8383`.
* `BOUNCER_PORT`
  Specifies on which port the bouncer is listening. Defaults to `8083`.
* `GUESTLISTER_MONGODB` __Required__
  Location for the mongo db. Defaults to `mongodb://localhost:27017/`. You will very likely need to change this.
* `GUESTLISTER_MONGODB_DATABASE`
  Which database inside the mongo db should be used. Defaults to `muncher`.
* `OAUTH_URL_AUTHORIZATION`
  Authorization URL used for the OAuth2 server. Defaults to `/oauth/authorize`.
* `OAUTH_URL_TOKEN`
  Token URL for the ORCID OAuth2 API. Defaults to `/oauth/token`.
* `OAUTH_SCOPE`
  Scope for the ORCID API. Defaults to `/authenticate`.
* `OAUTH_CLIENT_ID` __Required__
  The client ID for your instance. Defaults to `testClient`.
* `OAUTH_CLIENT_SECRET` __Required__
  The client secret for your instance. Defaults to `testSecret`.
  
## Sessions

Guestlister uses [express-session](https://github.com/expressjs/session) for the session management with [connect-ensure-login](https://github.com/jaredhanson/connect-ensure-login). It stores its own sessions in a collection named `guestlist`.

For simplicity, both the bouncer data and guestlister sessions are stored in the same database.
  
## Development

Settings have to be provided as environment variables, either at start time or via the debug configuration of your IDE.

To start guestlister execute the following steps.

Start a mongodb instance:

```bash
mkdir /tmp/o2r-mongodb-data
mongod --dbpath /tmp/o2r-mongodb-data
```

Start the o2r-bouncer:

```bash
DEBUG=* npm start
```

Start the guestlister:

```bash
DEBUG=* npm start
```

You can then start the offline login process by opening `http://localhost:8383/oauth/authorize?response_type=code&scope=/authenticate&client_id=testClient&redirect_uri=http://localhost:8083/api/v1/auth/login` and select a test user afterwards.

## License

*o2r guestlister* is licensed under Apache License, Version 2.0, see file LICENSE.

Copyright (C) 2018 - o2r project.

The code form [*oauth2orize-examples*](https://github.com/gerges-beshay/oauth2orize-examples) is licensed under MIT license; see the copyright notice contained in the files under the `lib` directory for more information.
