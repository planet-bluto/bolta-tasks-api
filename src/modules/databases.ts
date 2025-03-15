import Datastore from '@seald-io/nedb';
import { Events } from './events';
let db_cache: any = {}
export async function getDatabase(db_key: string, preload = false): Promise<Datastore<Record<string, any>>> {
  if (db_cache == undefined || db_cache[db_key] == null || preload) {
    db_cache[db_key] = new Datastore({ filename: `./db/${db_key}.db`})
    await db_cache[db_key].loadDatabaseAsync()
    _cache_update(db_key)
    return db_cache[db_key]
  } else {
    return db_cache[db_key]
  }
}

export async function _cache_update(db_key: string) {
  let db = await getDatabase(db_key)
  const docs = await db.findAsync({})

  db_doc_cache[db_key] = docs

  return docs
}

Events.on("update", (db_key) => {
  _cache_update(db_key)
})

let db_doc_cache: any = {}
export function getDatabaseStatic(db_key: string) { return db_doc_cache[db_key] }