var assert = require('assert');

var appboyUtil = require('../lib/appboyUtil');

// Unit tests for appboyUtil.
describe('appboyUtil', function() {
  describe('shouldOpenSession', function() {
    var shouldOpenSession = appboyUtil.shouldOpenSession;
    var invalidUserIds = [undefined, null, '', 0, false];
    var validUserIds = ['  ', 'abc', 1];

    it('should open if option is disabled regardless of userId', function() {
      invalidUserIds.forEach(
        (invalidUserIds,
        function(userId) {
          assert(shouldOpenSession(userId, {}));
          assert(
            shouldOpenSession(userId, { onlyTrackKnownUsersOnWeb: false })
          );
        })
      );
      validUserIds.forEach(
        (invalidUserIds,
        function(userId) {
          assert(shouldOpenSession(userId, {}));
          assert(
            shouldOpenSession(userId, { onlyTrackKnownUsersOnWeb: false })
          );
        })
      );
    });

    it('should conditionally open if option is enabled and userId is valid', function() {
      invalidUserIds.forEach(
        (invalidUserIds,
        function(userId) {
          assert(
            !shouldOpenSession(userId, { onlyTrackKnownUsersOnWeb: true })
          );
        })
      );
      validUserIds.forEach(
        (invalidUserIds,
        function(userId) {
          assert(shouldOpenSession(userId, { onlyTrackKnownUsersOnWeb: true }));
        })
      );
    });
  });
});
