const LinkDiscoverer = require('./linkDiscoverer')
async function rover() {
  const linkDiscoverer = new LinkDiscoverer('https://www.stratypus.com')
  await linkDiscoverer.run()
  console.log(linkDiscoverer.sitemap)
}
rover()