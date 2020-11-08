# BruinBot-Backend

### Set up instructions:

Install node dependencies
```
npm install
```

Create .env file in root directory with the following enviornment variables:
```
ATLAS_UR=<Your Atlas URI>
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
npm run eslint
```