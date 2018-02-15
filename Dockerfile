# (C) Copyright 2018 The o2r project. https://o2r.info
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
FROM alpine:3.6

# Add Alpine mirrors, replacing default repositories with edge ones, based on https://github.com/jfloff/alpine-python/blob/master/3.4/Dockerfile
RUN echo \
  && echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" > /etc/apk/repositories \
  && echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories \
  && echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories

RUN apk add --no-cache \
    nodejs \
    dumb-init \
    nodejs-npm \
  && rm -rf /var/cache

WORKDIR /guestlister
COPY config config
COPY lib lib
COPY css css
COPY views views
COPY app.js app.js
COPY package.json package.json
RUN npm install --production

# Metadata params provided with docker build command
ARG VERSION=dev
ARG VCS_URL
ARG VCS_REF
ARG BUILD_DATE

# Metadata http://label-schema.org/rc1/
LABEL maintainer="o2r-project <https://o2r.info>" \
  org.label-schema.vendor="o2r guestlister" \
  org.label-schema.url="http://o2r.info" \
  org.label-schema.name="o2r guestlister" \
  org.label-schema.description="offline login for o2r reference-implementation" \
  org.label-schema.version=$VERSION \
  org.label-schema.vcs-url=$VCS_URL \
  org.label-schema.vcs-ref=$VCS_REF \
  org.label-schema.build-date=$BUILD_DATE \
  org.label-schema.docker.schema-version="rc1"

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npm", "start" ]