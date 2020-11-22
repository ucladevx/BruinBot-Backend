# BruinBot-Backend
Our backend stack consists of Express + Mongoose. Refer to our [notion page](https://www.notion.so/uclabruinbot/Backend-dcd2a56527e34f87a697e8b54c52ce96) for more details. 

### Set up instructions:

Install node dependencies
```
npm ci
```

Create .env file in root directory with the following enviornment variables:
```
ATLAS_URI=<Your Atlas URI>
```

Run server
```
node server.js
```

Recommended: run server with nodemon (automatic server restart everytime code is changed)
```
npx nodemon server.js
```

Useful: check to see if your code is formatted and documented properly by running eslint!
```
npm run lint
```
