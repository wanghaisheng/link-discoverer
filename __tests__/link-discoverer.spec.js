const LinkDiscoverer = require('../link-discoverer')
const mockAxios = require('axios')
const html = require('./config/html')

describe('Link Discoverer Class', () => {

  const globalLinkDiscoverer = new LinkDiscoverer('https://www.getg5.com/')

  test('constructor prop tests', () => {
    expect(globalLinkDiscoverer.homepageUrl).toEqual('https://www.getg5.com/')
    expect(globalLinkDiscoverer.homePageUrl).not.toEqual(null)
    expect(globalLinkDiscoverer.pages.length).toEqual(1)
    expect(globalLinkDiscoverer.pagesToCrawl).toEqual(['https://www.getg5.com/'])
    expect(globalLinkDiscoverer.urlRejects).toEqual([
      'tel:',
      'mailto:',
      '.jpg',
      'javascript:void(0)'
    ])
  })

  test('invalid contructor param', () => {
    try {
      const invalidLinkDiscoverer = new LinkDiscoverer()
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
  })

  test('validUrl', () => {
    expect(globalLinkDiscoverer.validURL('')).toEqual(false)
    expect(globalLinkDiscoverer.validURL('https://www.getg5.com/')).toEqual(true)
  })

  test("request page", async () => {
    //setup
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: html
      })
    )
    const response = await globalLinkDiscoverer.requestPage('https://www.getg5.com/');

    // assertions / expects
    expect(response.data).toEqual(html);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith('https://www.getg5.com/')
  })

  test('nextPage', () => {
    const linkDiscoverer = new LinkDiscoverer('https://www.getg5.com/')
    expect(linkDiscoverer.nextPage()).toEqual('https://www.getg5.com/')
    expect(linkDiscoverer.nextPage()).toEqual(undefined)
  })

  test('run', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: html
      })
    )
    const linkDiscoverer = new LinkDiscoverer('https://www.getg5.com/')
    await linkDiscoverer.run()
    expect(linkDiscoverer.pagesToCrawl).toEqual([])
    expect(linkDiscoverer.pages.length).toEqual(6)
    expect(linkDiscoverer.crawledPages.length).toEqual(6)
  })

  test('getValidLinks', async () => {
    const validLinkDiscoverer = new LinkDiscoverer('https://www.getg5.com/')
    //test with links
    await validLinkDiscoverer.getLinks(html)
    expect(validLinkDiscoverer.pages).toEqual([
      'https://www.getg5.com/',
      'https://www.getg5.com/solutions/multifamily/',
      'https://www.getg5.com/solutions/senior-living/',
      'https://www.getg5.com/solutions/self-storage/',
      'https://www.getg5.com/solutions/why-g5/',
      'https://www.getg5.com/solutions/how-to-get-started/'
    ])
    expect(validLinkDiscoverer.pages.length).not.toEqual(0)
    expect(validLinkDiscoverer.pagesToCrawl).toEqual([
      'https://www.getg5.com/',
      'https://www.getg5.com/solutions/multifamily/',
      'https://www.getg5.com/solutions/senior-living/',
      'https://www.getg5.com/solutions/self-storage/',
      'https://www.getg5.com/solutions/why-g5/',
      'https://www.getg5.com/solutions/how-to-get-started/'
    ])
    expect(validLinkDiscoverer.pagesToCrawl.length).not.toEqual(0)

    const invalidLinkDiscoverer = new LinkDiscoverer('https://www.getg5.com/')

    //test without links
    await invalidLinkDiscoverer.getLinks('there is no links in this text')
    expect(invalidLinkDiscoverer.pages).toEqual(['https://www.getg5.com/'])
  })

  test('formatLink', () => {
    expect(globalLinkDiscoverer.formatLink('/some-extension')).toEqual('https://www.getg5.com/some-extension')
    expect(globalLinkDiscoverer.formatLink('https://www.getg5.com/some-extension')).toEqual('https://www.getg5.com/some-extension')
  })

  test('isKeeper', () => {
    expect(globalLinkDiscoverer.isKeeper('/some-extension')).toEqual(true)
    expect(globalLinkDiscoverer.isKeeper('https://www.getg5.com/some-extension')).toEqual(true)
    expect(globalLinkDiscoverer.isKeeper('/some-extension.jpg')).toEqual(false)
    expect(globalLinkDiscoverer.isKeeper('https://www.getg5.com/some-extension.jpg')).toEqual(false)
    expect(globalLinkDiscoverer.isKeeper('mailto:https://www.getg5.com/some-extension.jpg')).toEqual(false)
  })
})
