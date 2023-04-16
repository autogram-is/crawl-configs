module.exports = (spidergram) => {
  return {
    extends: [
      './spider.json5', './analysis.json5', './queries.json5', './reports.json5', '../../arango.config.yml'
    ],
    configVersion: '0.9.22',
    arango: {
      databaseName: "schwab",
    },
    offloadBodyHtml: 'db',
    normalizer: (url) => {
      spidergram.globalNormalizer(url, {
        forceProtocol: 'https:',
        forceLowercase: 'href',
        discardSubdomain: 'ww*',
        supplySubdomain: 'www',
        discardAnchor: true,
        discardAuth: true,
        discardIndex: '**/{index,default}.{htm,html,aspx,php}',
        discardSearch: '!{page,p,file,branchid,fc}',
        discardTrailingSlash: false,
        sortSearchParams: true,
      });
      
      // Treat PDF reader embeds as a target URL
      if (url.pathname.endsWith('pdf.js/web/viewer.html') && url.searchParams.has('file')) {
        url.href = url.searchParams.get('file');
      }
      return url;
    }
  }
}