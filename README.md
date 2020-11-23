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
ATLAS_URI_TEST=<Your Atlas test URI>
```

Start the server
```
npm run dev
```

Make sure your code passes the style linter! Check for mistakes and fix some of them automatically:
```
npm run lint
npm run lint:fix
```
