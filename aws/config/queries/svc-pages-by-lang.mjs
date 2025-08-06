export const svcPagesByLang = `
  FOR u IN unique_urls
  FILTER u.handler != 'sitemap' AND u.handler != 'robotstxt' AND u.handler != 'status'
  LET nonenglish = (u.parsed.path[0] LIKE '__\\\\___')
  COLLECT
      language = (nonenglish ? u.parsed.path[0] : 'en_en'),
      product = (nonenglish ? u.parsed.path[1] : u.parsed.path[0])
  WITH count INTO total
  FILTER product != null AND product != ''
  SORT product ASC, total DESC
  return { product, language, total }
`;