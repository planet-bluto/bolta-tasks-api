import { app, SocketIO } from "./server"
import Datastore, { Document } from "@seald-io/nedb"
import asyncHandler from "express-async-handler"

import cors from "cors"
import { PlannerTask, PlannerTaskStatic, remindingTasks, UpdateType } from "bolta-tasks-core"
import { Events } from "./events"
import { FocusTimer, TIMERS } from "./timers"
import { getDatabase } from "./databases"

app.use(cors())

// POST bolta.planet-bluto.net/planner_tasks/ => { title: "wow!", reminders: [...], ... }
// Do I do ID assignment here?? I guess so huh....
// Also kill any pre-existing IDs bro... KILL IT

app.post("/db/:db/", asyncHandler( async (req, res) => { // ADD
  let db = await getDatabase(req.params.db)
  let new_doc = await db.insertAsync(req.body)
  // res.sendStatus(200)
  Events.emit("update", req.params.db, UpdateType.NEW, new_doc)
  res.json(new_doc)
}))

// GET bolta.planet-bluto.net/reminding_tasks/1739716200000 => [{ title: "wow!", reminders: [...], ... }, ...]
app.get("/db/reminding_tasks/:timestamp", asyncHandler( async (req, res) => { // GET_REMINDERS_AT_TIMESTAMP
  let db = await getDatabase("planner_tasks")
  let docs = await db.findAsync({})

  let tasks = (docs as Document<Record<string, PlannerTaskStatic>[]>).map(doc => (new PlannerTask(doc as unknown as PlannerTaskStatic)))
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
  if (updated.numAffected > 0) {
    Events.emit("update", req.params.db, UpdateType.EDIT, req.params.id)
  }
  res.json(updated)
}))

// PATCH bolta.planet-bluto.net/planner_tasks/98123719872390232/insert => { title: "wow!", reminders: [...], ... }

app.patch("/db/:db/:id/insert", asyncHandler( async (req, res) => { // INSERT SUB DATA
  // print("pepepoingpnoigspnom:", req.body)
  let db = await getDatabase(req.params.db)

  if (typeof(req.body.key) == 'string' && req.body.value != null) {
    let key: {[index: string]: string} = {}
    key[req.body.key] = req.body.value
  
    let updated = await db.updateAsync({ _id: req.params.id }, { $push: key })
    // res.sendStatus(200)
    if (updated.numAffected > 0) {
      Events.emit("update", req.params.db, UpdateType.EDIT, req.params.id)
    }
    res.json(updated)
  }
}))

// PATCH bolta.planet-bluto.net/planner_tasks/98123719872390232/edit => { title: "wow!", reminders: [...], ... }

app.patch("/db/:db/:id/edit", asyncHandler( async (req, res) => { // edit SUB DATA
  // print("pepepoingpnoigspnom:", req.body)
  let db = await getDatabase(req.params.db)

  if (typeof(req.body.key) == 'string' && typeof(req.body.index) == 'number' && req.body.value != null) {
    let doc = await db.findOneAsync({ _id: req.params.id })

    doc[req.body.key][req.body.index] = Object.assign(doc[req.body.key][req.body.index], req.body.value)

    let updated = await db.updateAsync({ _id: req.params.id }, { $set: doc })
    // res.sendStatus(200)
    if (updated.numAffected > 0) {
      Events.emit("update", req.params.db, UpdateType.EDIT, req.params.id)
    }
    res.json(updated)
  }
}))

// MOVE bolta.planet-bluto.net/planner_tasks/98123719872390232/remove

app.patch("/db/:db/:id/move", asyncHandler( async (req, res) => { // remove SUB DATA
  let db = await getDatabase(req.params.db)

  if (typeof(req.body.key) == 'string' && typeof(req.body.from) == 'number' && typeof(req.body.to) == 'number') {
    let doc = await db.findOneAsync({ _id: req.params.id });

    (doc[req.body.key] as any[]).move(req.body.from, req.body.to)

    let updated = await db.updateAsync({ _id: req.params.id }, { $set: doc })
    // res.sendStatus(200)
    if (updated.numAffected > 0) {
      Events.emit("update", req.params.db, UpdateType.EDIT, req.params.id)
    }
    res.json(updated)
  }
}))

// DELETE bolta.planet-bluto.net/planner_tasks/98123719872390232/remove

app.patch("/db/:db/:id/remove", asyncHandler( async (req, res) => { // remove SUB DATA
  let db = await getDatabase(req.params.db)

  if (typeof(req.body.key) == 'string' && typeof(req.body.index) == 'number') {
    let doc = await db.findOneAsync({ _id: req.params.id });

    (doc[req.body.key] as any[]).remove(req.body.index)

    let updated = await db.updateAsync({ _id: req.params.id }, { $set: doc })
    // res.sendStatus(200)
    if (updated.numAffected > 0) {
      Events.emit("update", req.params.db, UpdateType.EDIT, req.params.id)
    }
    res.json(updated)
  }
}))

// DELETE bolta.planet-bluto.net/planner_tasks/98123719872390232
// bye bye :(

app.delete("/db/:db/:id", asyncHandler( async (req, res) => { // DELETE
  let db = await getDatabase(req.params.db)
  let removed = await db.removeAsync({ _id: req.params.id }, {})
  // res.sendStatus(200)
  if (removed > 0) {
    Events.emit("update", req.params.db, UpdateType.DELETE, req.params.id)
  }
  res.json(removed)
}))

app.get("/focus_timers/:id", asyncHandler( async (req, res) => {
  let timer = TIMERS[req.params.id]

  let props = Object.getOwnPropertyNames(timer) as (keyof FocusTimer)[]
  let static_timer: any = {}
  props.forEach(prop => {
    if (prop == "session") {
      static_timer["session_id"] = timer[prop]._id
    } else if (!["_timeout"].includes(prop)) {
      static_timer[prop] = timer[prop]
    }
  })

  if (timer != undefined) {
    res.json(static_timer)
  } else {
    res.json({})
  }
}))

app.patch("/focus_timers/:id/call/:method", asyncHandler( async (req, res) => {
  let timer = TIMERS[req.params.id]
  let method: keyof FocusTimer = (req.params.method as keyof FocusTimer)
  let args: any[] = (Array.isArray(req.body.args) ? req.body.args : [])

  if (timer != undefined) {
    let result = timer[method](...args)
    Events.emit("update_timer", req.params.id)
    res.send(result)
  } else {
    res.send()
  }
}))