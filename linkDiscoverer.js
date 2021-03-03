const https = require('https')
const axios = require('axios')
const cheerio = require('cheerio')

class LinkDiscoverer {
  constructor (homepageUrl) {
    if (!homepageUrl) {
      throw new Error('Constructor is missing the homepage URL.')
    }
    const url = (homepageUrl.slice(-1) !== '/') ? homepageUrl +'/' : homepageUrl
    this.homepageUrl = url
    this.pages = [url]
    this.pagesToCrawl = [url]
    this.crawledPages = []
    this.urlRejects = [
      'tel:',
      'mailto:',
      '.jpg',
      'javascript:void(0)'
    ]
  }

  /**
   * Tests if a string is a Valid URL
   * @param {String} str
   * @returns
   * @memberof LinkDiscoverer
   */
  validURL (str) {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str)
  }

  /**
   * Get next page URL to crawl
   * @memberof linkDiscoverer
   */
  nextPage () {
    return this.pagesToCrawl.pop()
  }

  /**
   * Discover all Links on the website
   * @memberof linkDiscoverer
   */
  async run () {
    while (this.pagesToCrawl.length > 0) {
      try {
        const url = this.nextPage()
        const page = await this.requestPage(url)
        this.getLinks(page.data)
        this.crawledPages.push(url) 
      } catch (error) {
        console.error(error)
      }
    } 
  }

  /**
   * Find links on the page
   * @param {String} page
   * @memberof linkDiscoverer
   */
  getLinks (page) {
    if (page && typeof page === "string") {
      const $ = cheerio.load(page)
      const anchors = $('a').toArray()
      anchors.forEach((anchor) => {
        if (anchor.attribs && anchor.attribs.href && this.isKeeper(anchor.attribs.href)) {
          const link = this.formatLink(anchor.attribs.href)
          if (link.includes(this.homepageUrl) && !this.pages.includes(link)) {
            this.pages.push(link)
          }
          if (link.includes(this.homepageUrl) && !this.pagesToCrawl.includes(link) && !this.crawledPages.includes(link)) {
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
      formattedLink = this.homepageUrl.slice(-1) === '/'
        ? `${this.homepageUrl}${link.substring(1)}`
        : `${this.homepageUrl}${link}`
    } else if (!/(http|https)|\.(com|net|org|biz|ca|care|gov)/.test(link)) {
    formattedLink = `${this.homepageUrl}${link}`
    }
    const trimLink = this.trimQuery(formattedLink)
    return trimLink
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
  * GET request to url
  * @param {String} url
  * @returns
  * @memberof linkDiscoverer
  */
  requestPage (url) {
    return axios.get(url, {
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    })
  }

  /**
   * Check if the anchor contains any of the rejected formats
   * @param {String} anchor
   * @returns
   * @memberof linkDiscoverer
   */
  isKeeper (anchor) {
    return this.urlRejects.every(reject => !anchor.includes(reject))
  }

  /**
   * @memberof LinkDiscoverer
   */
  get sitemap () {
    return this.pages
  }

  /**
   * @memberof LinkDiscoverer
   */
  set sitemap (urls) {
    this.pages = urls
  }
}

module.exports = LinkDiscoverer
