import { Import } from './base-import.js';

export class TaxonomyImport extends Import {
  public inputFiles = ['taxonomies.tsv'];
  public outputFile = 'taxonomies.jsonld';
  public arangoCollection = 'taxonomies';
  public name = 'taxonomy overview';

  map(row: Record<string, string>) {
    return {
      _key: row._key || row.name.toLocaleLowerCase().replaceAll(/[^a-z]/g, ''),
      name: this.formatString(row.name),
      description: this.formatString(row.description),
      aem: Boolean(row.aem),
      ue: Boolean(row.ue),
      aliases: [row.alias1,row.alias2,row.alias3,row.alias4].filter(Boolean)
    };
  }
}