FROM node:18-alpine

WORKDIR /app
COPY dist ./dist
COPY package*.json config.env ./

RUN npm install

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

EXPOSE 4000

CMD npm run start
