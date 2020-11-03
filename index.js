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

app.post('/', async (req, res) => {
  if (!req.body) {
    const msg = 'no Pub/Sub message received';
    console.error(`error: ${msg}`);
    res.status(400).send(`Bad Request: ${msg}`);
    return;
  }
  console.log(req.body)
  if (!req.body.message) {
    const msg = 'invalid Pub/Sub message format'
    console.error(`error: ${msg}`)
    res.status(400).send(`Bad Request: ${msg}`)
    return
  }
  const pubSubMessage = req.body.message;
  const name = pubSubMessage.data
    ? Buffer.from(pubSubMessage.data, 'base64').toString().trim()
    : 'World';

  res.status(204).send();
  // try {
  //   const { url } = req.body
  //   const sitemap = await rover(url)
  //   // res.json(sitemap)
  // } catch (err) {
  //   res.status(503).send(`There was a problem: ${err}`)
  // }
})
