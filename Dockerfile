FROM node:10-alpine

ENV PORT 3000

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json /usr/src/app/
RUN npm install

# Configuration to run behind a proxy
# making outgoing calls to pass through this proxy service
#RUN npm config set proxy http://localhost:80
# RUN npm config set https-proxy http://localhost:443

# Bundle app source
COPY . /usr/src/app

RUN npm run build
EXPOSE 3000

CMD [ "npm", "run","start" ]