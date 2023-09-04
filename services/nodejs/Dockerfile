FROM node:20-alpine

RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

COPY app .

RUN npm install

CMD [ "node", "index.js" ]
