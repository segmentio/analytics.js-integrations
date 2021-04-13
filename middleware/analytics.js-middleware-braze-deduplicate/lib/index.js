let user = {
  id: null,
  anonymousId: null,
  traits: null
};

module.exports = function(params) {
  const { payload, next, integrations } = params;

  if (payload.type() === 'identify' && integrations['Appboy']) {
    const obj = payload.obj;

    // Only send the event to Braze if a trait has changed
    obj.integrations.Appboy = shouldSendToBraze(payload);
  }

  // Ensure analytics.user is defined
  if (window.analytics && window.analytics.user) {
    user.id = analytics.user().id();
    user.anonymousId = analytics.user().anonymousId();
    user.traits = analytics.user().traits();
  }

  next(payload);
};

function shouldSendToBraze(payload) {
  if (
    payload.userId() !== user.id ||
    payload.anonymousId() !== user.anonymousId
  ) {
    return true;
  }

  const traits = payload.traits();
  delete traits.id;

  return JSON.stringify(user.traits) !== JSON.stringify(traits);
}
