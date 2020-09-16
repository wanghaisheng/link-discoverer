const axios = require('axios')
const cheerio = require('cheerio')
class LinkDiscoverer {
  constructor(homepageUrl) {
    this.homepageUrl = homepageUrl
    this.pages = []
    this.pagesToCrawl = [homepageUrl]
    this.crawledPages = []
    this.urlRejects = [
      'tel:',
      'mailto:',
      '.jpg',
      'javascript:void(0)'
    ]
  }

  /**
   * GET request to url
   *
   * @param {*} url
   * @returns
   * @memberof linkDiscoverer
   */

  requestPage(url) {
    return axios.get(url)
  }

  /**
   * Get next page URL to crawl
   *
   * @memberof linkDiscoverer
   */

  nextPage() {
    return this.pagesToCrawl.pop()
  }

  /**
   * Discover all Links on the website
   *
   * @memberof linkDiscoverer
   */

  async run() {
    while (this.pagesToCrawl.length > 0) {
      const url = this.nextPage()
      const page = await this.requestPage(url)
      await this.getLinks(page.data)
      this.crawledPages.push(url)
    }
  }

  /**
   * Find links on the page
   *
   * @param {*} page
   * @memberof linkDiscoverer
   */

  getLinks(page) {
    const $ = cheerio.load(page)
    const anchors = $('a').toArray()
    anchors.forEach((anchor) => {
      if (anchor.attribs && anchor.attribs.href && this.isKeeper(anchor.attribs.href)) {
        const link = this.formatLink(anchor.attribs.href)
        if (link.includes(this.homepageUrl) && !this.pages.includes(link)) {
          this.pages.push(link)
        }
      }
    }, this)
  }

  /**
   * Make sure the link is an absolute path
   *
   * @param {*} link
   * @returns
   * @memberof LinkDiscoverer
   */
  formatLink(link) {
    if (link.charAt(0) === '/') {
      return `${this.homepageUrl}${link}`
    } else if (!/\.(com|net|org|biz|ca|care|gov)/.test(link)) {
      return `${this.homepageUrl}/${link}`
    } else {
      return link
    }
  }

  /**
   * Check if the anchor contains any of the rejected formats
   *
   * @param {String} anchor
   * @returns Boolean
   * @memberof linkDiscoverer
   */
  isKeeper(anchor) {
    return this.urlRejects.every(reject => !anchor.includes(reject))
  }
  /**
   * Remove any querystrings and hash from url
   *
   * @param {*} url
   * @memberof linkDiscoverer
   */
  scrubLink(url) {

  }

  get sitemap() {
    return this.pages
  }

  set sitemap(urls) {
    this.pages = urls
  }
}

module.exports = LinkDiscoverer