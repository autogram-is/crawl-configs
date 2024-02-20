export const awsSvcLangs = {
  group: 'AWS',
  name: 'aws-svc-lang',
  description: 'Service Pages by Language',
  settings: {
    type: 'json',
    path: '{{name}}/{{date}}-data',
    readable: true,
    combine: true,
  },
  data: {
    languages: {
      de_de: "German",
      es_es: "English",
      fr_fr: "French",
      id_id: "Indonesian",
      it_it: "Italian",
      ja_jp: "Japanese",
      ko_kr: "Korean",
      pt_br: "Portugese",
      zh_cn: "Chinese (simplified)",
      zh_tw: "Chinese (traditional)"
    }
  },
  queries: {
    values: `
      FOR u IN unique_urls
      FILTER u.handler != 'sitemap' AND u.handler != 'robotstxt' AND u.handler != 'status'
      LET nonenglish = (u.parsed.path[0] LIKE '__\\\\\\\\___')
      COLLECT
          language = (nonenglish ? u.parsed.path[0] : 'en_en'),
          product = (nonenglish ? u.parsed.path[1] : u.parsed.path[0])
      WITH count INTO total
      FILTER product != null AND product != ''
      SORT product ASC, total DESC
      return { product, language, total }
    `
  }
}
