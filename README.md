# o2r-guestlister

A Node.js OAuth2 server implementation to allow offline login with o2r-bouncer as part of the [o2r reference-implementation](https://github.com/o2r-project/reference-implementation).

Based on the repository https://github.com/gerges-beshay/oauth2orize-examples and the underlying OAuth2 server implementation [oauth2orize](https://www.npmjs.com/package/oauth2orize).


Requirements:

- nodejs `>= 6.2`
- npm

## Endpoints

* `/login` User login: Allows to chose between three different uses with basic, advanced and admin rights.
* `/oauth/authorize` Starts an authorization request granting an authorization code.
* `/oauth/token` Exchange an authorization code for an access token.

## Demo data

The service creates three test users when starting the service:
 
* A basic user with level `100`,
* an editor with level `500`,
* and an admin with level `1000`.

This allows trying out the o2r reference-implementation without going through the [ORCID](https://orcid.org/) app registration.

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
  Location for the mongo db. Defaults to `mongodb://localhost/`. You will very likely need to change this.
* `GUESTLISTER_MONGODB_DATABASE`
  Which database inside the mongo db should be used. Defaults to `muncher`.
* `OAUTH_URL_AUTHORIZATION`
  Authorization URL used for the OAuth2 server. Defaults to `/oauth/authorize`.
* `OAUTH_URL_TOKEN`
  Token URL for the ORCID OAuth2 API. Defaults to `/oauth/token`.
* `OAUTH_SCOPE`
  Scope for the ORCID API. Defaults to `/authenticate`.
* `OAUTH_CLIENT_ID` __Required__
  The client ID for your instance.
* `OAUTH_CLIENT_SECRET` __Required__
  The client secret for your instance.
  
## Development

Settings have to be provided as environment variables, either at start time or via the debug configuration of your IDE.

To start guestlister execute the following steps.

Start a mongodb instance:

```
mkdir /tmp/o2r-mongodb-data
mongod --dbpath /tmp/o2r-mongodb-data
```

Start the o2r-bouncer:

```
DEBUG=* OAUTH_CLIENT_ID=clientid OAUTH_CLIENT_SECRET=secret npm start
```

Start the guestlister:

```bash
DEBUG=* OAUTH_CLIENT_ID=clientid OAUTH_CLIENT_SECRET=secret npm start
```

You can then start the offline login process by opening `http://localhost:8383/api/v1/oauth/authorize?response_type=code&scope=/authenticate&client_id=<your-client-ID>&redirect_uri=http://localhost:8083/api/v1/auth/login` and select a test user afterwards.

## License

*o2r guestlister* is licensed under Apache License, Version 2.0, see file LICENSE.

Copyright (C) 2018 - o2r project.

