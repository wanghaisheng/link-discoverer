const LinkDiscoverer = require('../link-discoverer')
const mockAxios = require('axios')
const html = require('./config/html')
const { PubSub } = require('@google-cloud/pubsub')

describe('Link Discoverer Class', () => {

  let linkDiscoverer
  beforeEach(() => {
    linkDiscoverer = new LinkDiscoverer('https://www.getg5.com/', 'testTopicName')
  })
  test('constructor prop tests', () => {
    expect(linkDiscoverer.homepageUrl).toEqual('https://www.getg5.com/')
    expect(linkDiscoverer.homePageUrl).not.toEqual(null)
    expect(linkDiscoverer.pages.length).toEqual(1)
    expect(linkDiscoverer.pagesToCrawl).toEqual(['https://www.getg5.com/'])
    expect(linkDiscoverer.urlRejects).toEqual([
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
    expect(linkDiscoverer.validURL('')).toEqual(false)
    expect(linkDiscoverer.validURL('https://www.getg5.com/')).toEqual(true)
  })

  test("request page", async () => {
    //setup
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: html
      })
    )
    const response = await linkDiscoverer.requestPage('https://www.getg5.com/');

    // assertions / expects
    expect(response.data).toEqual(html);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith('https://www.getg5.com/')
  })

  test('nextPage', () => {
    expect(linkDiscoverer.nextPage()).toEqual('https://www.getg5.com/')
    expect(linkDiscoverer.nextPage()).toEqual(undefined)
  })

  test('send buffer', async () => {
    const mockProjectId = 12345
    const pubSubClient = new PubSub({ mockProjectId })
    linkDiscoverer.pubSubClient = pubSubClient
    const spyTopic = jest.spyOn(pubSubClient, 'topic')
    const spyPublishMessage = jest.spyOn(pubSubClient, 'publishMessage')
    await linkDiscoverer.sendBuffer(1, 'www.test.com', null)
    expect(spyTopic).toHaveBeenCalledTimes(1)
    expect(spyTopic).toHaveBeenCalledWith(linkDiscoverer.topicName, { enableMessageOrdering: true })
    expect(spyPublishMessage).toHaveBeenCalledTimes(1)
  })

  test('run', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: html
      })
    )
    const mockSendBuffer = jest.spyOn(linkDiscoverer, 'sendBuffer').mockImplementation(() => jest.fn())
    await linkDiscoverer.run()
    expect(mockSendBuffer).toHaveBeenCalledTimes(linkDiscoverer.pages.length + 1)
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
    expect(linkDiscoverer.formatLink('/some-extension')).toEqual('https://www.getg5.com/some-extension')
    expect(linkDiscoverer.formatLink('https://www.getg5.com/some-extension')).toEqual('https://www.getg5.com/some-extension')
  })

  test('isKeeper', () => {
    expect(linkDiscoverer.isKeeper('/some-extension')).toEqual(true)
    expect(linkDiscoverer.isKeeper('https://www.getg5.com/some-extension')).toEqual(true)
    expect(linkDiscoverer.isKeeper('/some-extension.jpg')).toEqual(false)
    expect(linkDiscoverer.isKeeper('https://www.getg5.com/some-extension.jpg')).toEqual(false)
    expect(linkDiscoverer.isKeeper('mailto:https://www.getg5.com/some-extension.jpg')).toEqual(false)
  })
})
