const LinkDiscoverer = require('./linkDiscoverer')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 8080

app.use(bodyParser.json({ limit: '1000kb' }))

async function rover(url) {
  const linkDiscoverer = new LinkDiscoverer(url)
  await linkDiscoverer.run()
  return linkDiscoverer.sitemap
}

app.get('/', (req, res) => {
  res.send('I\'m Here!')
})

app.post('/discover', async (req, res) => {
  const { url } = req.body
  const sitemap = await rover(url)
  res.json(sitemap)
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
