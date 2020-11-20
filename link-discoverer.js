const axios = require('axios')
const cheerio = require('cheerio')
const { PubSub } = require('@google-cloud/pubsub')
const { GCP_PROJECT_ID: projectId } = process.env
class LinkDiscoverer {
  constructor(homepageUrl, topicName) {
    if (!homepageUrl) {
      throw new Error('missing constructor param')
    }
    const url = (homepageUrl.slice(-1) !== '/') ? homepageUrl +'/' : homepageUrl
    this.topicName = topicName
    this.pubSubClient = new PubSub({ projectId })
    this.homepageUrl = url
    this.pages = [url]
    this.complete = false
    this.pagesToCrawl = [url]
    this.crawledPages = []
    this.urlRejects = [
      'tel:',
      'mailto:',
      '.jpg',
      'javascript:void(0)',
      '.js',
      '.png',
      '.css',
      '.svg',
      '.gif',
      'sitemap',
      '.xml',
      '.json',
      'javascript',
      'JavaScript',
      '.jpeg',
    ]
  }

  /**
   * Tests if a string is a Valid URL
   * @param {*} str
   * @returns { Boolean }
   * @memberof LinkDiscoverer
   */
  validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
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
  nextPage() {
    return this.pagesToCrawl.pop()
  }

  sendBuffer(log, results, errors) {
    const totalPages = this.crawledPages.length + this.pagesToCrawl.length
    const progress = Math.round(this.crawledPages.length / totalPages)
    const dataBuffer = Buffer.from(JSON.stringify({
      progress,
      complete: this.complete,
      log,
      results,
      errors
     }))
     this.pubSubClient.topic(this.topicName, { enableMessageOrdering: true })
      .publishMessage({data: dataBuffer, orderingKey: 'linkDiscoverer' })
  }

  /**
   * Discover all Links on the website
   * @memberof linkDiscoverer
   */
  async run() {
    while (this.pagesToCrawl.length > 0) {
      try {
        const url = this.nextPage()
        console.log(url)
        if (this.topicName) {
          this.sendBuffer(url, null, null)
        }
        const page = await this.requestPage(url)
        this.getLinks(page.data)
        this.crawledPages.push(url) 
      } catch (error) {
        if (this.topicName) {
          this.sendBuffer(null, null, error)
        }
      }
    }
    this.complete = true
    if (this.topicName) {
      this.sendBuffer(null, this.pages, null)
    }
  }

  /**
   * Find links on the page
   * @param {*} page
   * @memberof linkDiscoverer
   */
  getLinks(page) {
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
   * @param {*} link
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

  trimQuery(link) {
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
  * @param {*} url
  * @returns
  * @memberof linkDiscoverer
  */
  requestPage(url) {
    return axios.get(url)
  }

  /**
   * Check if the anchor contains any of the rejected formats
   * @param {String} anchor
   * @returns Boolean
   * @memberof linkDiscoverer
   */
  isKeeper(anchor) {
    return this.urlRejects.every(reject => !anchor.includes(reject))
  }

  /**
   * Remove any querystrings and hash from url
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
