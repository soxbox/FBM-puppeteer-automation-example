# FBM Automations With Puppeteer

As FBM is working on developing out API's You can still perform automations with the HTTP Protocal.

### Example Provided

All these actions are taking advantage of how FBM currently function

- Authenticate
- Export Visits With Filteres
- Iteerate over guest visits and load into the individual visit pages

## Setup

### Config

Cope `dev.env` to `.env`

Set the variables USERNAME, PASSWORD, BASE_URL

### Running

Requires node 14

Install the libraries

```
yarn
```

To Build the tyypescript code

```
yarn start
```

In another terminal window you can now

```
node dist/index.js
```

### notes

TO go 100% headless which will not show the browser launching in the index.ts change `headless` to true
