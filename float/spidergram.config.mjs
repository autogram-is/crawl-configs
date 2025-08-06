export default () => {
  return {
    extends: ["../arango.config.yml"],
    arango: {
      databaseName: "float",
    },
    offloadBodyHtml: 'file',
    spider: {
      saveXhrList: true,
      savePerformance: true,
      saveCookies: true,
      maxConcurrency: 2,
      maxRequestsPerMinute: 60,
      stealth: true,
      urls: {
        crawl: 'same-hostname'
      }
    },
    analysis: {
      content: {
        selector: ["div.site-content", "main", "body"]
      },
      properties: {
        "content.title": ["data.meta.og.title", "data.head.title"],
        "content.description": ["data.meta.og.description", "data.head.description"],
        "content.published": "data.schemaOrg.Article.datePublished",
        "content.cms": [
          'tech.CMS.[0]',
          'tech.Blogs.[0]',
          {
            source: 'data.links.preconnect[0].href',
            matching: 'http*://**/*prismic*',
            value: 'Prismic'
          }
        ],
      }
    },
    queries: {
      overview: `
        FOR resource IN resources
        LET inlinks = UNIQUE(
          FOR rw IN responds_with
            FOR lt IN links_to
              FOR source IN resources
              FILTER source._id == lt._from
            FILTER lt._to == rw._from
          FILTER rw._to == resource._id
          RETURN source.url
        )
        LET outlinks = UNIQUE(
          FOR lt IN links_to
            FOR target IN unique_urls
            FILTER target._id == lt._to
          FILTER lt._from == resource._id
          RETURN target.url
        )
        FILTER resource.code == 200
        FILTER resource.mime == 'text/html'
        SORT resource.url ASC
        RETURN {
          Site: resource.parsed.hostname,
          Path: resource.parsed.pathname,
          Directory: (LENGTH(resource.parsed.path) > 1 && resource.mime == 'text/html') ? resource.parsed.path[0] : null,
          CMS: resource.content.cms,
          Title: resource.content.title,
          Description: resource.content.description,
          Author: resource.content.author,
          Date: resource.content.published,
          Words: resource.content.readability.words,
          Readability: resource.content.readability.score,
          Cookies: LENGTH(resource.cookies),
          Technologies: LENGTH(resource.tech),
          Opengraph: IS_OBJECT(resource.data.meta.og),
          Twitter: IS_OBJECT(resource.data.meta.twitter),
          Schema_Org: IS_OBJECT(resource.data.schemaOrg),
          Pagespeed: resource.pagespeed.overall,
          Accessibility: resource.pagespeed.accessibility,
          BestPractices: resource.pagespeed.bestPractices,
          SEO: resource.pagespeed.seo,
          Inlinks: LENGTH(inlinks),
          Outlinks: LENGTH(outlinks)
        }
      `
    }
  }
}