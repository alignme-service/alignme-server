###################
# BUILD FOR LOCAL
###################

FROM node:18-alpine As development

WORKDIR /usr/src/app

RUN chown -R node:node /usr/src/app

COPY --chown=node:node package*.json ./

RUN yarn install

COPY --chown=node:node . .

RUN mkdir -p /usr/src/app/dist && chown -R node:node /usr/src/app/dist

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:18-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

RUN yarn run build

ENV NODE_ENV production

RUN chown -R node:node /usr/src/app/dist

RUN yarn install --only=production && yarn cache clean --force

USER node

###################
# PRODUCTION
###################

FROM node:18-alpine As production

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

RUN chown -R node:node /usr/src/app/dist

CMD [ "node", "dist/main.js" ]