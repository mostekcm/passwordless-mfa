'use latest';

import express from 'express';
import { fromExpress } from 'webtask-tools';
import bodyParser from 'body-parser';
import Bandwidth from 'node-bandwidth';
const app = express();

app.use(bodyParser.json());

const jwt = require('express-jwt');

app.use((req, res, next) => {
  const issuer = 'https://' + req.webtaskContext.secrets.AUTH0_DOMAIN + '/';
  jwt({
    secret: req.webtaskContext.secrets.SIGNING_SECRET,
    audience: req.webtaskContext.secrets.AUDIENCE,
    subject: 'urn:Auth0',
    issuer: issuer,
    algorithms: [ 'HS256' ]
  })(req, res, next);
});

app.get('/test', (req, res) => {
  // test endpoint, no-operation
  res.send(200);
});

app.get('/', (req, res) => {
  // add your logic, you can use scopes from req.user
  const client = new Bandwidth({
    userId: req.webtaskContext.secrets.BANDWIDTH_USER_ID,
    apiToken: req.webtaskContext.secrets.BANDWIDTH_TOKEN,
    apiSecret: req.webtaskContext.secrets.BANDWIDTH_SECRET
  });
  client.Message.send({
    from: req.query.sender,
    to: req.query.recipient,
    text: req.query.body
  })
    .then(function(message) {
      console.log('message sent with id ', message.id);
      res.json({ message: 'OK' });
    })
    .catch(function(err) {
      console.error('Caught error trying to send message: ', err.message);
      res.send(500);
    })
});

module.exports = fromExpress(app);
