export const analysis = {
  content: {
    selector: ["#main-col-body", "div.container > div.document > div.body"]
  },
  site: ['data.meta.product', 'data.meta.service-name'],
  properties: {
    'aws.product': ['data.meta.product', 'data.meta.service-name'],
    'aws.region': 'data.meta.deployment_region',
    'aws.guide': ['data.meta.guide', 'data.meta.guide-name'],
    'aws.feedbackItem': 'data.meta.feedback-item',
    'content.lastModified': ['data.headers.last-modified'],
  }
}