const axios = require('axios')
const { CMS_URL } = process.env
const { getToken } = require('./auth')
const LinkDiscoverer = require('./link-discoverer')

module.exports = class Sitemap extends LinkDiscoverer {
  constructor (params) {
    this.token = getToken()
    this.locationUrn = params.locationUrn
    this.clientUrn = params.clientUrn
    this.domain = params.domain
  }

  async onSingleDomain (
    locationUrn = this.locationUrn,
    clientUrn = this.clientUrn,
    domain = this.domain
  ) {
    const cms = this.getCmsUrl(clientUrn)
    const ops = `${cms}/websites?access_token=${this.token}`
    const websites = await this.getWebsites(ops)
    const clw = this.findProductionClw(locationUrn, websites)
    return `${domain}/${clw}-sitemap.xml`
  }

  findProductionClw (locationUrn, clws) {
    const clw = clws
      .filter(w => w.location_urn === locationUrn)
      .filter(w => w.is_production)
    return clw[0].urn
  }
  
  getSitemap () {
    return this.onSingleDomain()
  }

  getWebsites (url) {
    return axios.get(url).then(res => res.data)
  }

  getCmsUrl (urn = this.clientUrn) {
    return `${CMS_URL}/api/clients/${urn}`
  }
  
}
