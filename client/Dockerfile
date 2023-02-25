FROM node:18-alpine

WORKDIR /app
COPY dist ./dist
COPY package*.json config.env ./

RUN npm install

EXPOSE 4000

CMD npm run start
