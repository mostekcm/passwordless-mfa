const express = require('express');
const passport = require('passport');
const auth0 = require('auth0-js');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const router = express.Router();

const env = {
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
  AUTH0_CALLBACK_URL:
    process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback',
  AUTH0_LOGIN_DOMAIN: process.env.AUTH0_LOGIN_DOMAIN
};

const redirectButGrabState = (req, res, next) => {
  console.log('carlos, original uri: ', req.originalUrl);
  req.session.redirectState = req.query.state;
  req.session.loginHint = req.query.phoneNumber || req.query.email;
  req.session.authState = 'TODO-generate-some-nonce';
  const auth = new auth0.Authentication({
    clientID: env.AUTH0_CLIENT_ID,
    domain: env.AUTH0_DOMAIN,
    redirectUri: env.AUTH0_CALLBACK_URL
  });

  res.redirect(auth.buildAuthorizeUrl({
    prompt: 'login', // Enforce login every time
    login_hint: req.session.loginHint,
    loginHint: req.session.loginHint,
    responseType: 'code',
    audience: 'https://' + env.AUTH0_DOMAIN + '/userinfo',
    state: req.session.authState,
    scope: 'openid profile'
  }));
};

router.get('/', redirectButGrabState,
  function(req, res) {
    res.redirect("/failure");
});

router.get('/callback',
  passport.authenticate('auth0', {
    failureRedirect: '/failure'
  }),
  function(req, res) {
    /* Successfully did MFA, now redirect back to /continue */
    /* TODO: Validate internal state (or does passport do this?) and validate that the loginhint matches the sub */
    let mfaState = 'success';
    if (req.query.state !== req.session.authState) mfaState='bad state';
    else if (req.user.displayName !== req.session.loginHint) mfaState='bad user';
    res.redirect(`https://${env.AUTH0_LOGIN_DOMAIN}/continue?state=${req.session.redirectState}&mfa_result=${mfaState}`);
  }
);

router.get('/failure', function(req, res) {
  var error = req.flash("error");
  var error_description = req.flash("error_description");
  req.logout();
  res.render('failure', {
    error: error[0],
    error_description: error_description[0],
  });
});

module.exports = router;
