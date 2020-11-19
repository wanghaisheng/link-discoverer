const LinkDiscoverer = require('./link-discoverer')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 8080

app.use(bodyParser.json({ limit: '1000kb' }))

async function rover(url, topicName) {
  const linkDiscoverer = new LinkDiscoverer(url, topicName)
  await linkDiscoverer.run()
  return linkDiscoverer.sitemap
}

app.get('/', (req, res) => {
  res.send('I\'m Here!')
})

app.post('/discover', async (req, res) => {
  try {
    const { url, topicName } = req.body
    console.log(topicName)
    if (topicName) {
      rover(url, topicName)
      res.sendStatus(200)
    } else {
      const sitemap = await rover(url, null)
      res.json(sitemap)
    }
  } catch (err) {
    res.status(503).send(err)
  }
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
