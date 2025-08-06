
import 'dotenv/config';
import { bold } from 'yoctocolors';
import jetpack from '@eatonfyi/fs-jetpack';
import { nanoid } from '@eatonfyi/ids';
import { formatDistance, parse as parseDate } from '@eatonfyi/dates';
import { execa } from 'execa';
import { parse } from '@fast-csv/parse';


export interface ImportOptions extends Record<string, unknown> {
  directory?: string,
  inputFile?: string | string[],
  outputFile?: string,
  arangoCollection?: string
}

export interface PrecheckResults {
  errors: string[];
  warnings: string[];
  info: string[];
}

export class Import<InputFormat extends Record<string, string> = Record<string, string>> {
  public directory: typeof jetpack;
  public inputFiles: string[];
  public outputFile: string;
  public arangoCollection?: string;
  public name = 'records';

  public started = Date.now();
  public processed = 0;
  public skipped = 0;

  private arrify(input?: string | string[]): string[] {
    if (input === undefined) return [];
    return Array.isArray(input) ? input : [input];
  }

  constructor(options: ImportOptions = {}) {
    this.directory = jetpack.dir(options.directory ?? process.env.INPUT_DIR ?? 'input');
    this.inputFiles = this.arrify(options.inputFile ?? 'input.csv');
    this.outputFile = options.outputFile ?? 'output.csv';
    this.arangoCollection = options.arangoCollection;
  }
  
  get elapsed() {
    return formatDistance(this.started, Date.now(), { includeSeconds: true });
  }

  async precheck(): Promise<PrecheckResults> {
    const results: PrecheckResults = {
      errors: [],
      warnings: [],
      info: [],
    };

    if (this.directory.exists(this.outputFile)) {
      results.warnings.push(`${this.outputFile} exists, and will be overwritten`);
    }

    for (const inputFile of this.inputFiles) {
      if (!this.directory.exists(inputFile)) {
        results.errors.push(`${this.directory.path(inputFile)} not found`);
      }
    }

    return Promise.resolve(results);
  }

  async run(): Promise<void> {
    this.started = Date.now();
    const precheck = await this.precheck();

    this.log(precheck.errors, 'info');
    this.log(precheck.warnings, 'warning');
    this.log(precheck.errors, 'error');

    if (precheck.errors.length) this.log('Exiting export…', 'error');

    return new Promise<void>((resolve) => {
      const output = this.directory.createWriteStream(this.outputFile, { encoding: 'utf8', autoClose: true });

      for (const inputFile of this.inputFiles) {
        const delimiter = inputFile.endsWith('.tsv') ? '\t' : ',';
      
        this.directory.file(this.outputFile);
        this.directory.remove(this.outputFile);
      
        this.log(`Importing ${this.name}`)
    
        this.directory.createReadStream(inputFile)
          .pipe(
            parse({ headers: true, objectMode: true, delimiter }),
          )
          .on('data', row => {
            const data = this.map(row as InputFormat);
            if (data) {
              data._key ??= nanoid();
              output.write(JSON.stringify(data) + '\n');
              this.processed++;
            } else {
              this.skipped++;
            }
          })
          .on('end', () => {
            resolve();
          });
        }
      })
      .then(() => {
        if (this.arangoCollection) return this.moveToArango(this.arangoCollection)
      })
      .then(() => {
        console.log();
        this.log(`${this.processed} processed, ${this.skipped} skipped in ${this.elapsed}`);
      })
  }

  map(record: InputFormat): Record<string, unknown> | false {
    return record;
  }

  async moveToArango(collection: string) {
    const options = [
      `--server.authentication=false`,
      `--server.endpoint=${process.env.ARANGO_URL ?? 'http+tcp://127.0.0.1:8529'}`,
      `--server.database=${process.env.ARANGO_DB ?? '_system'}`,
      `--server.username=${process.env.ARANGO_USER ?? 'root'}`,
      `--server.password=${process.env.ARANGO_PASS ?? '\"\"'}`,
      `--collection=${collection}`,
      `--overwrite=true`,
      `--auto-rate-limit=true`,
      `--create-collection=true`,
      `--batch-size=2048`,
      `--type=jsonl`,
      `--file=${this.directory.path(this.outputFile)}`
    ];
    await execa('arangoimport', options, { stdout: 'inherit'})
      .catch(err => this.log(err.message, 'error'))
  }
  
  log(input: string | string[], level: 'error' | 'warning' | 'info' = 'info') {
    if (input.length === 0) return;

    const messages = typeof input === 'string' ? [input] : input;
    for (const message of messages) {
      console.log(`${bold(level)}: ${message}`);
    }
  }

  /**
   * Turns a comma-delimited string into an array of strings, trimming surrounding
   * whitespace and optionally optionally prefixing every item.
   */
  formatTags(input: string, prefix?: string) {
    const tags = input.replaceAll(/[\[\]]/g, '')
      .split(',')
      .filter(tag => tag.trim().length)
      .map(item => prefix ? [prefix, item.trim()].join(':') : item.trim());
  
    return tags.length ? tags : undefined;
  }

  unifyTags(input: Record<string, string[] | string | undefined>): Record<string, string[]> | undefined {
    const unique = new Set<string>();
    const unified: Record<string, string[]> = {};
    
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      const tags = Array.isArray(value) ? value : this.formatTags(value);
      for (const tag of tags ?? []) {
        unique.add(tag.includes(':') ? tag : [key, tag].join(':'));
      }
    }
  
    for (const value of unique.values()) {
      const [taxonomy, tag] = value.split(':');

      if (tag.length) {
        if (unified[taxonomy]) {
          unified[taxonomy].push(tag);
        } else {
          unified[taxonomy] = [tag];
        }
      }
    }
    return this.checkEmptyObject(unified);
  }
  
  /**
   * Turns empty strings, and the 'FIELD-EMPTY' value, into `undefined`.
   */
  formatString(input?: string) {
    const emptyStrings = [
      'field-empty',
      'n/a',
      'na',
      'null',
      'extension missing'
    ];
    if (input === undefined) return undefined;
    if (emptyStrings.includes(input.toLocaleLowerCase())) return undefined;
    if (input.trim().length === 0) return undefined;
    return input;
  }  
  
  checkEmptyObject<T extends Object>(input?: T) {
    for (const value of Object.values(input ?? {})) {
      if (Array.isArray(value) && value.length > 0) return input;
      if (value !== undefined && !(Array.isArray(value) && value.length == 0)) {
        return input;
      }
    }
    return undefined;
  }

  /**
   * Attempts to parse month/day/year strings into proper ISO date format.
   * If empty or invalid, returns undefined.
   */
  formatDate(input?: string, format = 'M/d/yy') {
    if (input === undefined || input.trim() === '') return undefined;
    try {
      return parseDate(input, format, new Date(Date.now())).toISOString().split('T').shift();
    } catch(err: unknown) {
      // We'll swallow this error and see how it goes.
    }
  }
  
  /**
   * Parses an Intel inventory status string and returns a set of flags
   * representing the underlying states that drive the statuses.
   */
  formatStatus(input: string) {
    // Currently supported statues:

    // [--DO NOT DELETE - LAST REP ACTION NEWER THAN 6 MONTHS--]
    // [--DO NOT DELETE - MOD DATE NEWER THAN 6 MONTHS--]
    // [--DO NOT DELETE - TEMPLATE SWAP MOD DATE NEWER THAN 30 DAYS--]
    // [--DO NOT DELETE - ACTIVE NODE--]
  
    // [--DO NOT DELETE - NODE CONTAINS ONE OR MORE FILES--]
    // [--DO NOT DELETE - ROOT TEST NODE CREATED WITH DATA TEMPLATE--]
    // [--DO NOT DELETE - TEST NODE FILE MOD DATE NEWER THAN 90 DAYS--]
    // [--DO NOT DELETE - INDETERMINANT--]
  
    // [--DO NOT DELETE - IN FLIGHT IN EOL PROCESS--]
    // [--DO NOT DELETE - CONTAINING NODE IN FLIGHT IN EOL PROCESS--]
  
    // [--DELETABLE - MOD DATE OLDER THAN 6 MONTHS--]
    // [--DELETABLE - MOD DATE AND LAST REP OLDER THAN 6 MONTHS--]
    // [--DELETABLE - OLD TEST NODE FILE--]
    // [--DELETABLE - ROOT TEST NODE FILE--]
    // [--DELETABLE - MSM MOVED FILE--]
  
    const pattern = /\[--([A-Z ]+) - ([A-Z0-9 ]+)--\]/;
    const results = pattern.exec(input);
  
    const output = {
      code: 'unknown',
      age: undefined as 'new' | 'old' | undefined,
      deletable: results?.[1] === 'DELETABLE',
      hasFiles: undefined as boolean | undefined,
      message: results?.[2],
    }
  
    if (output.message?.includes('NEWER THAN')) {
      output.age = 'new';
    } else if (output.message?.includes('OLDER THAN')) {
      output.age = 'old';
    } else if (output.message?.includes('OLD TEMPLATE')) {
      output.age = 'old';
    }
  
    if (output.message?.includes('ONE OR MORE FILES')) {
      output.hasFiles = true;
    }
  
    switch (true) {
      case output.message?.includes('TEST NODE'):
        output.code = 'test';
        break;
      case output.message?.includes('IN FLIGHT IN EOL'):
        output.code = 'eol';
        break;
      case output.message?.includes('MSM MOVED FILE'):
        output.code = 'moved';
        break;
      case output.message?.includes('OLDER THAN'):
      case output.message?.includes('NEWER THAN'):
      case output.message?.includes('ACTIVE NODE'):
      case output.message?.includes('ONE OR MORE FILES'):
        output.code = 'active';
        break;
      default:
        output.code = 'unknown';
        break;
    }
    return output;
  }
}