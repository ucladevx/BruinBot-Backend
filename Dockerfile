FROM node:14-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only-production

# Bundle app source
COPY . .

# Migrate db if necessary
RUN npx migrate up

EXPOSE 8080
CMD [ "npm", "start" ]
