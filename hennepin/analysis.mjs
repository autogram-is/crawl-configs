export const analysis = {
  content: {
    selector: ["main > section.page", "main#main", "div.cp_event-tip-detail-block", "main", "body"]
  },
  properties: {
    'content.title': ['data.meta.dc.title', 'data.info.Title'],
    'content.cms': 'tech.CMS[0]',
    'content.description': ['data.meta.description', 'data.dc.description'],
    'content.creator': ['data.meta.dcterms.creator'],
    'content.contributor': 'data.meta.dcterms.contributor',
    'content.audience': 'data.meta.dcterms.audience',
    'content.subject': 'data.meta.dcterms.subject',
    'content.type': 'data.meta.dcterms.type',
    'content.date': ['data.xmp.createdate'],
  }
}