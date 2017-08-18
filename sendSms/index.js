'use latest';

import express from 'express';
import { fromExpress } from 'webtask-tools';
import bodyParser from 'body-parser';
import Bandwidth from 'node-bandwidth';
import jwt from 'jsonwebtoken';

module.exports = (ctx, cb) => {
  // add your logic, you can use scopes from req.user
  const token = ctx.headers.authorization ? ctx.headers.authorization.split(' ')[1] : undefined;

  if (!token) return cb(new Error('unauthorized'));

  try {
    const decoded = jwt.verify(token, ctx.secrets.SIGNING_SECRET, {
      audience: ctx.secrets.AUDIENCE,
      issuer: 'Auth0',
      subject: `urn:Auth0`
    });

    const client = new Bandwidth({
      userId: ctx.secrets.BANDWIDTH_USER_ID,
      apiToken: ctx.secrets.BANDWIDTH_TOKEN,
      apiSecret: ctx.secrets.BANDWIDTH_SECRET
    });
    client.Message.send({
      from: ctx.body.sender,
      to: ctx.body.recipient,
      text: ctx.body.body
    })
      .then(function(message) {
        console.log('message sent with id ', message.id);
        return cb(null, { message: 'OK' });
      })
      .catch(function(err) {
        console.error('Caught error trying to send message: ', err.message);
        return cb(err);
      })
  } catch(err) {
    return cb(err);
  }
}
