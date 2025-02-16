import { app, SocketIO } from "./server"
import Datastore from "@seald-io/nedb"
import asyncHandler from "express-async-handler"

import cors from "cors"
import { PlannerTask, PlannerTaskStatic, remindingTasks } from "bolta-tasks-core"

app.use(cors())

var db_cache: any = {}
export async function getDatabase(db_key: string) {
  if (db_cache[db_key] == null) {
    db_cache[db_key] = new Datastore({ filename: `./db/${db_key}.db`})
    await db_cache[db_key].loadDatabaseAsync()
    return db_cache[db_key]
  } else {
    return db_cache[db_key]
  }
}

// POST bolta.planet-bluto.net/planner_tasks/ => { title: "wow!", reminders: [...], ... }
// Do I do ID assignment here?? I guess so huh....
// Also kill any pre-existing IDs bro... KILL IT

app.post("/db/:db/", asyncHandler( async (req, res) => { // ADD
  let db = await getDatabase(req.params.db)
  let new_doc = await db.insertAsync(req.body)
  // res.sendStatus(200)
  SocketIO.emit("update")
  res.json(new_doc)
}))

// GET bolta.planet-bluto.net/reminding_tasks/1739716200000 => [{ title: "wow!", reminders: [...], ... }, ...]
app.get("/db/reminding_tasks/:timestamp", asyncHandler( async (req, res) => { // GET_REMINDERS_AT_TIMESTAMP
  let db = await getDatabase("planner_tasks")
  let docs = await db.findAsync({})

  let tasks = docs.map((doc: PlannerTaskStatic) => new PlannerTask(doc))
  // print("Getting timestamp: ", Number(req.params.timestamp))
  
  let firedTasks = remindingTasks(tasks, Number(req.params.timestamp))

  res.json(firedTasks)
}))

// GET bolta.planet-bluto.net/planner_tasks/
// Perhaps use url params for limit and pagination??
  // (load all of them at once to bomb the website free hack)

app.get("/db/:db/", asyncHandler( async (req, res) => { // GET_ALL
  let db = await getDatabase(req.params.db)
  const docs = await db.findAsync({})
  res.json(docs)
}))

// GET bolta.planet-bluto.net/planner_tasks/98123719872390232

app.get("/db/:db/:id", asyncHandler( async (req, res) => { // GET_ONE
  let db = await getDatabase(req.params.db)
  const doc = await db.findOneAsync({ _id: req.params.id })
  res.json(doc)
}))

// PATCH bolta.planet-bluto.net/planner_tasks/98123719872390232 => { title: "wow!", reminders: [...], ... }

app.patch("/db/:db/:id", asyncHandler( async (req, res) => { // EDIT
  let db = await getDatabase(req.params.db)
  let updated = await db.updateAsync({ _id: req.params.id }, { $set: req.body })
  // res.sendStatus(200)
  SocketIO.emit("update")
  res.json(updated)
}))

// DELETE bolta.planet-bluto.net/planner_tasks/98123719872390232
// bye bye :(

app.delete("/db/:db/:id", asyncHandler( async (req, res) => { // DELETE
  let db = await getDatabase(req.params.db)
  let removed = await db.removeAsync({ _id: req.params.id }, {})
  // res.sendStatus(200)
  SocketIO.emit("update")
  res.json(removed)
}))