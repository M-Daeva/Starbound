FROM node:18-alpine

WORKDIR /app
COPY dist ./dist
COPY package*.json config.env ./
RUN sed -i "s/IS_PRODUCTION=false/IS_PRODUCTION=true/" ./config.env

RUN npm install

EXPOSE 4000

CMD npm run start
