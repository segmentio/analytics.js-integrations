module.exports = {
<% _.forEach(integrations, function(integration, i) { %>  '<%= integration.replace('@segment/analytics.js-integration-', '') %>': require('<%= integration %>')<%= i === integrations.length - 1 ? '' : ',\n' %><% }); %>
};
