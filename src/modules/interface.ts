import { Interfacer, Schedule } from "bolta-tasks-core"
import { _cache_update, getDatabaseStatic } from "./databases"

_cache_update("schedules")

Interfacer["resolveSchedule"] = (schedule_id: string) => {
  let docs = getDatabaseStatic("schedules")
  let raw_schedule = docs.find((doc: any) => doc._id == schedule_id)
  return  (new Schedule(raw_schedule))
}