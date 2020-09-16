const LinkDiscoverer = require('./linkDiscoverer')
async function rover(url) {
  const linkDiscoverer = new LinkDiscoverer(url)
  await linkDiscoverer.run()
  console.log(linkDiscoverer.sitemap)
}
// rover()

exports.rover = async (req, res) => {
  const { url } = req.body
  rover(url)
  res.sendStatus(200)
}