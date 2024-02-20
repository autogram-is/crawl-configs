import * as queries from './config/queries/index.mjs';
import * as reports from './config/reports/index.mjs';

export default () => {
  return {
    extends: ["../arango.config.yml"],
    arango: {
      databaseName: "aws",
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
      saveXhrList: true,
      savePerformance: true,
      saveCookies: true,
      maxConcurrency: 2,
      maxRequestsPerMinute: 60,
      stealth: true,
      urls: {
        regions: {
          header: "#awsdocs-header",
          content: "main",
          drawer: "div[class^=awsui_root_] > div[class^=awsui_layout_] > div[class^=awsui_drawer_]",
          footer: "div[data-testid=footer]"
        }
      }
    },
    analysis: {
      content: {
        selector: "main"
      }
    },
    queries,
    reports,
  }
}