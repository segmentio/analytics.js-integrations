const express = require('express')
const app = express()

module.exports = (ajs, port) => {
  app.get('/analytics.js', render)
  
  function render(req, res) {
    const { writeKey } = req.params
    res.send(ajs)
  }
  
  app.listen(port, () => console.log(`Analytics.js available at localhost:${port}/analytics.js`))
}