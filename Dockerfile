FROM node:16-alpine

ENV ROOT /app
WORKDIR ${ROOT}

COPY package.json /app
COPY package-lock.json /app

# RUN npm ci --only=production && npm cache clean --force
RUN npm install
RUN npm i ts-node
COPY . /app


CMD ["npm", "start"]
