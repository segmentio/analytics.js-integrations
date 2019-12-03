const express = require('express')
const app = express()

module.exports = (ajs, file, port) => {
  app.get('/', (req, res) => {
    res.sendFile(file)
  })

  const render = (req, res) => {
    const { writeKey } = req.params
    res.send(ajs)
  }

  app.get('/analytics.js', render)
  
  app.listen(port, () => console.log(`Analytics.js available at localhost:${port}/analytics.js`))
}
