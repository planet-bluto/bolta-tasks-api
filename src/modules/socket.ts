import { SocketIO } from "./server";
import { CalendarDate, CalendarDate_fromDate, ClockTime, PlannerTask, PlannerTaskStatic, remindingTasks, Task, wakeTime } from 'bolta-tasks-core';
import { Interval } from "./interval";
import { getDatabase } from "./databases";
import { Document } from "@seald-io/nedb";
import moment from 'moment';
import { fireNotification } from "./notifications";

// bro wrote nothing here
SocketIO.on('connection', (socket) => {
  print("+ Socket Connected")
})

Interval.on("minute", async (thisTimestamp) => {
  let db = await getDatabase("planner_tasks")
  let docs = await db.findAsync({})
  let tasks = (docs as Document<Record<string, PlannerTaskStatic>[]>).map(doc => new PlannerTask(doc as unknown as PlannerTaskStatic))
  
  let firedTasks = remindingTasks(tasks, thisTimestamp)

  if (firedTasks.length > 0) { SocketIO.emit("reminder", firedTasks) }
})

Interval.on("minute", reminderCheck)

export async function reminderCheck(thisTimestamp: number) {
  print("Checking reminders...")
  let db = await getDatabase("planner_tasks")
  let docs = await db.findAsync({})
  let tasks = (docs as Document<Record<string, PlannerTaskStatic>[]>).map(doc => new PlannerTask(doc as unknown as PlannerTaskStatic))

  let firedTasks: Task[] = remindingTasks(tasks, thisTimestamp)

  if (firedTasks.length > 0) {
    let payload = {
      title: `Reminder for ${firedTasks.length} task${(firedTasks.length > 1 ? "s" : "")}`,
      body: `Reminder${(firedTasks.length > 1 ? "s" : "")} for ${firedTasks.map(task => task.title).join(", ")}`
    }

    SocketIO.emit("reminder_tasks", firedTasks);
    fireNotification(payload)
  } 
  return firedTasks
}


Interval.on("minute", async (thisTimestamp: number) => {
  let db = await getDatabase("planner_tasks")
  let docs = await db.findAsync({})
  let tasks = (docs as Document<Record<string, PlannerTaskStatic>[]>).map(doc => new PlannerTask(doc as unknown as PlannerTaskStatic))

  let thisMoment = moment(thisTimestamp)
  let today: CalendarDate = {
    day: thisMoment.date(),
    month: thisMoment.month(),
    year: thisMoment.year()
  }

  let wake_time = wakeTime(tasks, today)
  print(wake_time)

  let diff = thisMoment.millisecond(0).second(0).diff(moment(wake_time), "minute")
  print(diff)

  if (diff == -1) {
    let webhooks = (process.env?.WAKE_WEBHOOKS ? process.env?.WAKE_WEBHOOKS.split("|") : [])
    webhooks.forEach((webhook: string) => {
      print("sending wake time to webhook: ", webhook)
      fetch(webhook, {
        method: "POST",
        body: JSON.stringify(wake_time)
      })
    })
  }
})