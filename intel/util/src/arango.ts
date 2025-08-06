import 'dotenv/config';
import { Database } from 'arangojs';
import { Config } from 'arangojs/connection.js';

export class ArangoDB extends Database {
  constructor(config?: Config) {
    const envDefaults = {
      url: process.env.ARANGO_URL,
      databaseName: process.env.ARANGO_DB,
      auth: {
        username: process.env.ARANGO_USER ?? 'root',
        password: process.env.ARANGO_PASS
      }
    };

    if (!config) {
      super(envDefaults);
    } else {
      super(config);
    }
  }

  /**
   * Push data to ArangoDB, and attempt to intuit the id/key/collection if possible.
   */
  async push(item: any, id?: string, update = true) {
    // Set the _collection and _key variables from the incoming ID if it exists,
    // and the item's own _id property if IT exists. If they're still not populated,
    // try the item's _collection and _key properties.
    let [_collection, _key] = (id ?? item._id)?.split('/') ?? [];
    _collection ??= item._collection;
    _key ??= item._key;
    const _id = [_collection, _key].join('/');

    if (_collection === undefined) {
      Promise.reject(
        new Error(
          'Item has no _collection property, and no collection was specified.'
        )
      );
    }
    if (_key === undefined) {
      Promise.reject(new Error('Item has no unique key, and none was given.'));
    }

    return this.collection(_collection) .save({ ...item, _id }, { overwriteMode: update ? 'update' : 'ignore' })
  }

  /**
   * A quick check to see if a given document exists.
   */
  async has(id: string): Promise<boolean> {
    const [collection, key] = id.split('/');
    return this.collection(collection).documentExists(key);
  }

  /**
   * Delete the document with the given ID from ArangoDB.
   */
  async delete(id: string, collection?: string): Promise<boolean> {
    const _id = [id, collection].filter(Boolean).join('/');
    const [_collection, _key] = _id.split('/');

    return this.collection(_collection)
      .remove({ _key })
      .then(() => true);
  }

  /**
   * Ensure a given collection exists; if it doesn't, create it.
   *
   * Returns a Promise that resolves to TRUE if the collection was created,
   * FALSE if it already existed.
   */
  async ensureCollection(name: string): Promise<boolean> {
    return this.collection(name)
      .exists()
      .then((exists) => {
        if (exists) return false;
        return this.createCollection(name).then(() => true);
      });
  }

  /**
   * Ensure a given edge collection exists; if it doesn't, create it.
   *
   * Returns a Promise that resolves to TRUE if the collection was created,
   * FALSE if it already existed.
   */
  async ensureEdgeCollection(name: string) {
    return this.collection(name)
      .exists()
      .then((exists) => {
        if (exists) return this.collection(name);
        return this.createEdgeCollection(name);
      });
  }

  /**
   * Blindly empties all the documents in a given collection.
   *
   * Returns a Promise that resolves to the number of documents deleted; if the collection
   * didn't exist at all, the count will be zero.
   */
  async empty(name: string): Promise<number> {
    return this.collection(name)
      .exists()
      .then((exists) => {
        if (exists) {
          return this.collection(name)
            .count()
            .then((count) =>
              this.collection(name)
                .truncate()
                .then(() => count.count)
            );
        } else {
          return 0;
        }
      });
  }

  /**
   * Blindly deletes a collection.
   *
   * Returns a Promise that resolves to TRUE if the collection was deleted deleted, and
   * FALSE if it didn't exist in the first place.
   */
  async destroy(name: string): Promise<boolean> {
    return this.collection(name)
      .exists()
      .then((exists) => {
        if (exists) {
          return this.collection(name)
            .drop()
            .then(() => true);
        } else {
          return false;
        }
      });
  }
}
