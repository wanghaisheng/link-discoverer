const LinkDiscoverer = require('./linkDiscoverer')
async function rover(url) {
  const linkDiscoverer = new LinkDiscoverer(url)
  await linkDiscoverer.run()
  return linkDiscoverer.sitemap
}
exports.rover = async (req, res) => {
  const { url } = req.body
  const sitemap = await rover(url)
  res.json(sitemap)
}