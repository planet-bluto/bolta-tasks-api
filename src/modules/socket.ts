import { SocketIO } from "./server";
import { PlannerTask, PlannerTaskStatic, remindingTasks } from 'bolta-tasks-core';
import { Interval } from "./interval";
import { getDatabase } from "./express";

// bro wrote nothing here
SocketIO.on('connection', (socket) => {
  print("+ Socket Connected")
})

Interval.on("minute", async (thisTimestamp) => {
  let db = await getDatabase("planner_tasks")
  let docs = await db.findAsync({})
  let tasks = docs.map((doc: PlannerTaskStatic) => new PlannerTask(doc))
  
  let firedTasks = remindingTasks(tasks, thisTimestamp)

  if (firedTasks.length > 0) { SocketIO.emit("reminder", firedTasks) }
})