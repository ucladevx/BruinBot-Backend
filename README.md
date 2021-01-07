# BruinBot-Backend
Our backend stack consists of Express + Mongoose. Refer to our [notion page](https://www.notion.so/uclabruinbot/Backend-dcd2a56527e34f87a697e8b54c52ce96) for more details. Our frontend repo can be found [here](https://github.com/ucladevx/BruinBot-Frontend).

### Set up instructions for development:
Install MongoDB Community Edition if you have not already: https://docs.mongodb.com/manual/administration/install-community/

Install node dependencies
```
npm ci
```

Start the database
```
mongod --config /usr/local/etc/mongod.conf
```

Migrate the database to the latest migration (fill the local dev database with useful objects such as bots, mapnodes, paths, and users):
```
npx migrate list
npx migrate up
```

Start the server (make sure you have the `.env` file)
```
npm run dev
```

Make sure your code passes the style linter - check for mistakes and fix some of them automatically
```
npm run lint
npm run lint:fix
```

Run tests
```
npm test
```

## Deployment
Software is deployed to AWS EC2 on every new release. 

Login as an IAM user to our AWS console: https://uclabruinbot.signin.aws.amazon.com/console
