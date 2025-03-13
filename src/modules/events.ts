import EventEmitter from "eventemitter3";
import { SocketIO } from "./server";
import { UpdateType } from "bolta-tasks-core";
import { getDatabase } from "./databases";

class EventsClass extends EventEmitter {}
export const Events = new EventsClass()

Events.on("update", async (db_key: string, type: UpdateType, data: any | null = null) => {
  SocketIO.emit("update", db_key, type, data)

  let db = await getDatabase(db_key)
  const docs = await db.findAsync({})
  SocketIO.emit("update_with_data", db_key, docs)
})

Events.on("update_timer", (timer_id: string) => {
  SocketIO.emit("update_timer", timer_id)
})