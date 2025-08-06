import { nanohash } from '@eatonfyi/ids';
import { Import } from './base-import.js';

export class TagImport extends Import {
  public inputFiles = ['tags.tsv'];
  public outputFile = 'tags.jsonld';
  public arangoCollection = 'tags';
  public name = 'taxonomy tags';

  ids: Record<string, string> = {};

  map(row: Record<string, string>) {

    const levels = [row.l1,row.l2,row.l3,row.l4].filter(Boolean);
    if (levels.length === 0) {
      return false;
    }

    // Correct some mismatches between our page data and the master tag list
    const tag = levels.join('/').toLocaleLowerCase()
      .replaceAll(/[^\/\w\d]/g, '')                                                     // only LC alphanumerics and slashes
      .replace('highdefinitionhdvideo', 'hdvideo') // 
      .replace('niformationtechnologyit', 'itinformationtechnology') // TDM/BTS terminology out of sync
      .replace('technicaldecisionmakertdm', 'btssbusinesstechnologysolutionspecialist') // TDM/BTS terminology out of sync
      .replace('srbusinessdecisionmakersrbdm', 'srbusinessdecisionmaker');              // srbdm suffix missing

    const _key = row.code?.trim() ?? nanohash(tag);
    this.ids[tag] = _key;
    const parentTag = tag.split('/').slice(0,-1).join('/');

    return {
      _key,
      taxonomy: `taxonomy/${row.prefix?.toLocaleLowerCase()}${row.taxonomy.toLocaleLowerCase().replaceAll(/[^a-z]/g, '')}`,
      parent: (parentTag && this.ids[parentTag]) ? `tags/${this.ids[parentTag]}` : undefined,
      tag,
      levels,
      path: levels.join(' / '),
      name: levels[levels.length-1],
      description: this.formatString(row.description)
    };
  }
}
