var appboyUtil = {
  /**
   * @param {string} userId
   * @param {object} options - integration options.
   * @returns {boolean} true if and only if should call window.appboy.openSession
   */
  shouldOpenSession: function(userId, options) {
    return !!(userId || !options.onlyTrackKnownUsersOnWeb);
  }
};

module.exports = appboyUtil;
