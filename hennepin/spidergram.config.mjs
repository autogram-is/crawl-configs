import { analysis } from './analysis.mjs';

export default () => {
  return {
    extends: [
       "../arango.config.yml",
       "./queries.json5",
       "./reports.json5",
    ],
    arango: {
      databaseName: "hennepin",
    },
    offloadBodyHtml: 'file',
    normalizer: {
      forceProtocol: 'https:',
      forceLowercase: 'hostname',
      discardAnchor: true,
      discardAuth: true,
      sortSearchParams: true,
    },
    spider: {
      seed: ['https://www.hennepin.us'],
      saveXhrList: true,
      savePerformance: true,
      saveCookies: true,
      maxConcurrency: 2,
      maxRequestsPerMinute: 60,
      headless: true,
      stealth: true,
      urls: {
        regions: {
          header: "header.site-header",
          sidenav: "#side-nav",
          content: "div.page-wrapper > :not(.site-header):not(aside)",
          footer: "footer.site-footer"
        },
      }
    },
    analysis
  }
}