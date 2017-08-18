function (user, context, callback) {
  console.log('Carlos, context request: ', context.request);
  if (context.protocol !== "redirect-callback") {
    console.log('carlos: ', user.user_metadata.phoneNumber);
    context.redirect = {
      url: "http://localhost:3000/?phoneNumber="+encodeURIComponent(user.user_metadata.phoneNumber)
    };
  } else if (!context.request.query.mfa_result || context.request.query.mfa_result !== 'success') {
    return callback(new UnauthorizedError(context.request.query.mfa_result));
  }
  return callback(null, user, context);
}