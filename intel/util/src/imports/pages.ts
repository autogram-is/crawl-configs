import { nanohash } from '@eatonfyi/ids';
import micromatch from 'micromatch';
import { Import } from './base-import.js';

const hubsAndLandingPages = [
  '/apps/intel/commons/templates/{hub,navigation,customcampaignlandingrwd,campaignLanding}',
  '/apps/intel/commons/templates/mobileFirst/{mf-hub,mf-navigation,mf-productslanding,mf-campaignLanding,mf-udeL1L2,mf-homepage-rwd}',
  '/apps/intel/support/template/{supportDynamicHubPage,supportLandingPage,supportL1ProductPage}',
  '/apps/intel/productscatalog/templates/{productPortfolio,productoverview,upeproductscatalog}',
  '/apps/intel/replatform/template/search',
];

const collectionForms = [
  '/apps/intel/commons/templates{gatedContentTemplate,optinConfirmationForm,optinForm}',
  '/apps/intel/forms/**'
];

export class PageImport extends Import {
  public inputFiles = ['aem-pages.tsv'];
  public outputFile = 'aem-pages.jsonld';
  public arangoCollection = 'pages';
  public name = 'dotcom pages';

  map(row: Record<string, string>) {
    if (row.URL.length === 0) return false;

    const record = {
      _key: nanohash(row.URL),
      url: row.URL,
      tld: this.formatString(row.ccTLD),
      hcp: this.formatString(row.HCP),
      hcr: this.formatString(row.HCR),
      status: this.checkEmptyObject(this.formatStatus(row.Status)),
      title: this.formatString(row['Short Title']),
      locale: this.checkEmptyObject({
        loc: this.formatString(row.Loc),
        lang: this.formatString(row.Lang),
        translationStatus: this.formatString(row['Translation Status']),
      }),
      owner: this.checkEmptyObject({
        primary: this.formatString(row['Primary Owner']),
        secondary: this.formatString(row['Secondary Owner']),
        creator: this.formatString(row['Created By']),
        manager: this.formatString(row['Managed By']),
        lastModifiedBy: this.formatString(row['Last Modified By']),
        organization: this.formatString(row['Owned By Business Group']),
      }),
      date: this.checkEmptyObject({
        created: this.formatDate(row['Creation Date']),
        expires: this.formatDate(row['Expiration Date']),
        modified: this.formatDate(row['Last Mod Date']),
        updated: this.formatDate(row['Last Updated Date']),
      }),
      lastRep: this.checkEmptyObject({
        action: this.formatString(row['Last Rep Action']),
        date: this.formatDate(row['Last Rep Action Date']),
        author: this.formatString(row['Last Rep Action Author']),
      }),
      liveRelationship: Boolean(row['LiveRelationship']),
      template: this.formatString(row.Template),
      keyword: this.formatString(row['Primary Keyword']),
      tags: this.unifyTags({
        types: row['Content Type'],
        seo: row['SEO Keyword'],
        primary: row['Tags Primary'],
        secondary: row['Tags Secondary'],
        audience: row['Tags Audience Primary'],
      }),
      shortTemplate: '',
      shortType: '',
      intent: {
        proposed: '',
        fallback: '',
        rule: '',
        note: ''
      }
    };

    record.shortType = record.tags?.emtcontenttype?.[0]?.split('/').pop() ?? '';
    record.shortTemplate = record.template?.split('/').pop() ?? '';

    // Populate default Intent, with a reason
    const section = record.hcr ?? '';
    const template = record.template ?? '';
    const types = record.tags?.emtcontenttype ?? [];

    // Template type
    if (micromatch([template], hubsAndLandingPages).length) {
      record.intent.proposed = 'wayfinding';
      record.intent.rule = 'template';
    }
    else if (micromatch([template], collectionForms).length) {
      record.intent.proposed = 'conversion';
      record.intent.rule = 'template';
    }

    
    // Section name
    else if (section === 'forms') {
      record.intent.proposed = 'conversion';
      record.intent.rule = 'section';
    }
    else if (section === 'docs') {
      record.intent.proposed = 'success';
      record.intent.rule = 'section';
    }
    else if (section === 'support') {
      record.intent.proposed = 'self-sufficiency';
      record.intent.rule = 'section';
    }
    else if (micromatch([section], ['security-center', 'trademarks', 'legal']).length) {
      record.intent.proposed = 'compliance';
      record.intent.rule = 'section';
    }
    else if (section === 'corporate-responsibility') {
      record.intent.proposed = 'demand';
      record.intent.rule = 'section';
    }


    // Customer Communication content
    else if (micromatch(types, ['customercommunications/{blog,contest}']).length) {
      record.intent.proposed = 'demand';
      record.intent.rule = 'type';
    }
    else if (micromatch(types, ['customercommunications/{article,news}']).length) {
      record.intent.proposed = 'demand';
      record.intent.fallback = 'activation';
      record.intent.rule = 'type';
    }
    else if (micromatch(types, ['customercommunications', 'customercommunications/**']).length) {
      record.intent.proposed = 'demand';
      record.intent.rule = 'type';
    }

    // Sales and Marketing content
    else if (micromatch(types, ['salesandmarketingmaterials/productcatalog']).length) {
      record.intent.proposed = 'wayfinding';
      record.intent.rule = 'type';
    }
    else if (micromatch(types, ['salesandmarketingmaterials/bestpractices']).length) {
      record.intent.proposed = 'success';
      record.intent.rule = 'type';
    }    
    else if (micromatch(types, ['salesandmarketingmaterials','salesandmarketingmaterials/**']).length) {
      record.intent.proposed = 'activation';
      record.intent.fallback = 'conversion';
      record.intent.rule = 'type';
      record.intent.note = 'Sales Enablemant input needed';
    }

    else if (types.includes('image/infographic')) {
      record.intent.proposed = 'activation';
      record.intent.rule = 'type';
    }

    // Design/Dev reference
    else if (micromatch(types, ['designanddevelopmentreference/technicalarticle']).length) {
      record.intent.proposed = 'activation';
      record.intent.rule = 'type';
    }
    else if (micromatch(types, ['designanddevelopmentreference/{programmingreference,referenceguide}']).length) {
      record.intent.proposed = 'success';
      record.intent.rule = 'type';
    }
    else if (micromatch(types, ['designanddevelopmentreference','designanddevelopmentreference/**']).length) {
      record.intent.proposed = 'self-sufficiency';
      record.intent.rule = 'type';
    }

    // Productsupport content
    else if (micromatch(types, ['productsupport','productsupport/**']).length) {
      record.intent.proposed = 'self-sufficiency';
      record.intent.rule = 'type';
    }
    
    // Data sheets and schematics
    else if (micromatch(types, ['datasheetsspecificationsandschematics','datasheetsspecificationsandschematics/**']).length) {
      record.intent.proposed = 'self-sufficiency';
      record.intent.fallback = 'conversion';
      record.intent.rule = 'type';
      record.intent.note = 'Sales Enablemant input needed';
    }

    // Software or Drivers
    else if (micromatch(types, ['softwareordriver/{models,referenceimplementations}']).length) {
      record.intent.proposed = 'success';
      record.intent.rule = 'type';
    }
    else if (micromatch(types, ['softwareordriver','softwareordriver/**']).length) {
      record.intent.proposed = 'self-sufficiency';
      record.intent.rule = 'type';
    }

    else if (micromatch(types, ['training','training/**']).length) {
      record.intent.proposed = 'success';
      record.intent.rule = 'type';
    }

    else if (micromatch(types, ['legal','legal/**']).length) {
      record.intent.proposed = 'compliance';
      record.intent.rule = 'type';
    }

    else if (types.includes('donotuse/document/report')) {
      record.intent.proposed = 'compliance';
      record.intent.rule = 'type';
    }

    else if (micromatch(types, ['donotuse/webpage/landingpage', 'document/productdocument/productcatalog']).length) {
      record.intent.proposed = 'wayfinding';
      record.intent.rule = 'type';
      record.intent.note = "Critical L3 Tag"
    }

    else if (micromatch(types, ['donotuse/webpage/article']).length) {
      record.intent.proposed = 'demand';
      record.intent.fallback = 'activation';
      record.intent.rule = 'type';
      record.intent.note = "Critical L3 Tag"
    }


    return record;
  }
}


