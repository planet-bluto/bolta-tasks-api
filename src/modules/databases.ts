import Datastore from '@seald-io/nedb';
let db_cache: any = {}
export async function getDatabase(db_key: string): Promise<Datastore<Record<string, any>>> {
  if (db_cache == undefined || db_cache[db_key] == null) {
    db_cache[db_key] = new Datastore({ filename: `./db/${db_key}.db`})
    await db_cache[db_key].loadDatabaseAsync()
    return db_cache[db_key]
  } else {
    return db_cache[db_key]
  }
}