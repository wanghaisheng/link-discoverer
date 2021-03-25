require('dotenv').config()
const express = require('express')
const LinkDiscoverer = require('./link-discoverer')
const Sitemap = require('./sitemap')
const app = express()
const port = process.env.PORT || 8080

app.use(express.json({ limit: '1000kb' }))

if (process.env.NODE_ENV !== 'production') {
  app.use('/', (req, res, next) => {
    console.log(req.path, req.body)
    next()
  })
}

async function rover (url) {
  const linkDiscoverer = new LinkDiscoverer(url)
  await linkDiscoverer.run()
  return linkDiscoverer.sitemap
}

app.get('/', (req, res) => res.send('I\'m Listening.'))

app.post('/', async (req, res) => {
  try {
    const { url } = req.body
    const sitemap = await rover(url)
    res.json(sitemap)
  } catch (err) {
    res.status(503).json(err)
  }
})

app.post('/internal', async (req, res) => {
  try {
    const sitemap = new Sitemap(req.body)
    const pages = sitemap.getSitemap()
    res.json(pages)
  } catch (error) {
    res.send(error)
  }
})

app.listen(port, () => console.log(`:${port} I'm Listening.`))
