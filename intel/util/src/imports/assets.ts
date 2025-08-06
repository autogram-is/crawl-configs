import { nanohash } from '@eatonfyi/ids';
import { Import } from './base-import.js';
import { Extension } from 'typescript';

export class AssetImport extends Import {
  public inputFiles = ['assets.tsv'];
  public outputFile = 'weekly-assets.jsonld';
  public arangoCollection = 'assets';
  public name = 'managed assets';

  map(row: Record<string, string>) {
    return {
      _key: nanohash(row.File),
      file: this.formatString(row.File),
      size: this.formatString(row.Size),
      extension: this.formatString(row.Extension),
      type: this.formatString(row['Content Type']),
      id: this.checkEmptyObject({
        unique: this.formatString(row['Unique ID']),
        brightcove: this.formatString(row['Brightcove ID']),
        idl: this.formatString(row['IDL Reference']),
      }),
      status: this.formatStatus(row.Status),
      owner: this.checkEmptyObject({
        primary: this.formatString(row['Primary Owner']),
        secondary: this.formatString(row['Secondary Owner']),
        creator: this.formatString(row['Created By']),
        lastModifiedBy: this.formatString(row['Last Mod By']),
      }),
      date: this.checkEmptyObject({
        created: this.formatDate(row['Creation Date']),
        expires: this.formatDate(row['Expire']),
        modified: this.formatDate(row['Last Mod Date']),
      }),
      lastRep: this.checkEmptyObject({
        action: this.formatString(row['Last Rep Action']),
        date: this.formatDate(row['Last Rep Action Date']),
        author: this.formatString(row['Last Rep Action Author']),
      }),
      lastRollout: this.checkEmptyObject({
        date: this.formatDate(row['Last Rolled Out Date']),
        author: this.formatString(row['Last Rolled Out By']),
      }),
      liveRelationship: Boolean(row['LiveRelationship']),
      template: this.formatString(row.Template),
      keyword: this.formatString(row['Primary Keyword']),
      tags: this.unifyTags({
        related: row['Related Tags'],
        campaign: row['Tags Campaign'],
        industry: row['Tags Industry'],
        lifecycle: row['Tags Lifecycle'],
        location: row.Location,
        organization: row['Owned By Business Group'],
        product: row['Tags Product'],
        program: row['Tags Program'],
        software: row['Tags Software'],
        solution: row['Tags Solution'],
        subject: row['Tags Subject'],
        system: row['Tags System Type'],
        technology: row['Tags Technology'],
        usage: row['Usage Type'],
      }),
      legal: this.checkEmptyObject({
        reviewer: this.formatString(row['Legal Reviewer']),
        agency: this.formatString(row['Source Agency']),
        license: this.formatString(row['License Description']),
        guidelines: this.formatString(row['Usage Guidelines']),
      }),
    };
  }
}