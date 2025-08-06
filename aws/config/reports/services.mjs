import * as queries from '../queries/index.mjs';

export const services = {
  group: 'AWS',
  name: 'services',
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
  queries: { values: queries.svcPagesByLang }
}
