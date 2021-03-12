const https = require('https')
const axios = require('axios').create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})
const cheerio = require('cheerio')

const reject = [
  'tel:',
  'mailto:',
  '.jpg',
  'javascript:void(0)'
]

function setUrl (homepageUrl) {
  return (homepageUrl.slice(-1) !== '/')
    ? `${homepageUrl}/`
    : homepageUrl
}

class LinkDiscoverer {
  constructor (homepageUrl) {
    if (!homepageUrl) {
      throw new Error('Constructor is missing the homepage URL.')
    }
    const url = setUrl(homepageUrl)

    this.homepageUrl = url
    this.rootDomain = this.getRootDomain(url)
    this.pagesToCrawl = [url]
    this.crawledPages = []
    this.currentUrl = null
    this.urlsWithErrors = []
    this.urlRejects = reject
  }

  /**
   * Tests if a string is a Valid URL
   * @param {String} str
   * @returns
   * @memberof LinkDiscoverer
   */
  validURL (str) {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // Protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // Domain Name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR IP (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // Port and Path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // Query String
      '(\\#[-a-z\\d_]*)?$', 'i'); // Fragment Locator
    return !!pattern.test(str)
  }

  /**
   * Get next page URL to crawl
   * @memberof LinkDiscoverer
   */
  nextPage () {
    return this.pagesToCrawl.pop()
  }

  /**
   * Discover all Links on the website
   * @memberof LinkDiscoverer
   */
  async run () {
    while (this.pagesToCrawl.length > 0) {
      try {
        this.currentUrl = this.nextPage()
        const page = await this.requestPage()
        this.getLinks(page.data)
        this.crawledPages.push(this.currentUrl) 
      } catch (error) {
        this.urlsWithErrors.push(this.currentUrl)
        console.log(error)
      }
    }
  }

  /**
   * Find links on the page
   * @param {String} page
   * @memberof LinkDiscoverer
   */
  getLinks (page) {
    if (page && typeof page === "string") {
      const $ = cheerio.load(page)
      const anchors = $('a').toArray()
      anchors.forEach((anchor) => {
        if (anchor.attribs && anchor.attribs.href && this.isKeeper(anchor.attribs.href)) {
          const link = this.formatLink(anchor.attribs.href)
          const uniqueArr = [
            ...new Set([
              ...this.pagesToCrawl,
              ...this.crawledPages,
              ...this.urlsWithErrors
            ])
          ]
          if (link.includes(this.homepageUrl) && !uniqueArr.includes(link) && this.currentUrl !== link) {
            this.pagesToCrawl.push(link)
          }
        }
      }, this)
    }
  }

  /**
   * Make sure the link is an absolute path
   * @param {String} link
   * @returns
   * @memberof LinkDiscoverer
   */
  formatLink(link) {
    let formattedLink = link
    if (link.charAt(0) === '/') {
      formattedLink = `${this.rootDomain}${link}`
    } else if (!/(http|https)|\.(com|net|org|biz|ca|care|gov)/.test(link)) {
    formattedLink = `${this.homepageUrl}${link}`
    }
    const trimLink = this.trimQuery(formattedLink)
    return trimLink
  }

  /**
   * @memberof LinkDiscoverer
   * @param {String} url 
   * @returns 
   */
  getRootDomain (url) {
    const domain = new URL(url)
    return `${domain.protocol}//${domain.host}`
  }

  /**
   * @memberof LinkDiscoverer
   * @param {String} link 
   * @returns 
   */
  trimQuery (link) {
     if (link.includes('?')) {
       const li = link.lastIndexOf('?')
       link = link.substr(0, li)
     }
     if (link.includes('#')) {
      const li = link.lastIndexOf('#')
      link = link.substr(0, li)
    }
    return link
  }

  /**
  * @param {String} url
  * @returns
  * @memberof LinkDiscoverer
  */
  requestPage () {
    return axios.get(this.currentUrl)
  }

  /**
   * Check if the anchor contains any of the rejected formats
   * @param {String} anchor
   * @returns
   * @memberof LinkDiscoverer
   */
  isKeeper (anchor) {
    return this.urlRejects.every(reject => !anchor.includes(reject))
  }

  /**
   * @memberof LinkDiscoverer
   */
  get sitemap () {
    return this.crawledPages
  }

  /**
   * @memberof LinkDiscoverer
   */
  set sitemap (urls) {
    this.crawledPages = urls
  }
}

module.exports = LinkDiscoverer
