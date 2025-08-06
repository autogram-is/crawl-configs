import { nanohash } from '@eatonfyi/ids';
import { Import } from './base-import.js';
import { Extension } from 'typescript';

export class PageViews extends Import {
  public inputFiles = ['pageviews.csv'];
  public outputFile = 'anon_views.jsonld';
  public arangoCollection = 'anon_views';
  public name = 'logged out pageviews';

  map(row: Record<string, string>) {
    if (URL.canParse(row.URL)) {
      return {
        _key: nanohash(row.URL),
        url: this.formatString(row.URL),
        views: Number.parseFloat(row.Views ?? ''),
        bounce: Number.parseFloat(row.BounceRate ?? ''),
      };
    } else {
      this.log(`Can't import for URL ${row.URL}`);
      return false;
    }
  }
}