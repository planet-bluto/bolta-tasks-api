import { FocusSession, FocusSessionStatic, UpdateType } from "bolta-tasks-core";
import { getDatabase } from "./databases";
import { Events } from "./events";
import { fireNotification } from "./notifications";

function wrapNumber(num: number, min: number, max: number) {
  const range = max - min + 1;
  return (num - min) % range + min;
}

export class FocusTimer {
  intervals: number;
  session: FocusSession;
  running: boolean = false;

  _elapsed: number = 0;
  _start_time: number = 0;
  _timeout: any | null = null;

  constructor(session: FocusSession) {
    // super()
    this.session = session
    this.intervals = 0

    // this.on("expired", this._expired)
  }

  get perc() {
    return (1.0 - (this.time_remaining / this.current_interval.duration))
  }

  get current_interval_index() {
    // return (this.intervals % this.session.interval.length)
    return wrapNumber(this.intervals, 0, this.session.interval.length-1)
  }

  get current_interval() {
    return this.session.interval[this.current_interval_index]
  }

  get time_remaining() {
    let _raw = this.current_interval.duration - (this.running ? Date.now() - this._start_time : 0) - (this._elapsed)
    return Math.max(_raw, 0)
  }

  _hard_stop() {
    this._elapsed = 0
    this.reset()
  }

  _expired() {
    this._hard_stop()
    this.intervals += 1
    Events.emit("update_timer", this.session._id)
    fireNotification({
      title: `Focus Timer for '${this.session.title}' Expired!`,
      body: `Now on '${this.current_interval.label}'!`
    })
  }

  back() {
    this._hard_stop()
    if (this.intervals == 0) {
      this.intervals = this.session.interval.length-1
    } else {
      this.intervals -= 1
    }
  }

  next() {
    this._hard_stop()
    this.intervals += 1
  }

  jump(interval: number) {
    this._hard_stop()
    this.intervals = interval
  }

  start() {
    if (this.running) { return }

    this.running = true
    this._start_time = Date.now()
    this._timeout = setTimeout(() => {
      this._expired()
    }, this.current_interval.duration - (this._elapsed))
  }

  pause() {
    if (!this.running) { return }

    this.running = false
    this._elapsed += Date.now() - this._start_time
    clearTimeout(this._timeout)
  }

  reset() {
    this.running = false
    this._elapsed = 0
    clearTimeout(this._timeout)
  }

  seek(ms: number) {
    if (this.running) {
      this.running = false
      clearTimeout(this._timeout)
    }
    
    this._elapsed = ms
  }
}

//// TIMER MANAGEMENT

export const TIMERS: {[id: string]: FocusTimer} = {}

getDatabase("focus_sessions").then(async (db) => {
  const docs = await db.findAsync({})
  docs.forEach(doc => {
    TIMERS[doc._id] = new FocusTimer(doc as unknown as FocusSessionStatic)
  })
})

Events.on("update", async (db_key: string, type: UpdateType, data: any | null = null) => {
  if (db_key == "focus_sessions") {
    switch (type) {
      case UpdateType.NEW:
        TIMERS[data._id] = new FocusTimer(new FocusSession(data as unknown as FocusSessionStatic))
      break;
      case UpdateType.EDIT:
        let db = await getDatabase("focus_sessions")
        const doc = await db.findOneAsync({ _id: data })
        TIMERS[data] = new FocusTimer(new FocusSession(doc as unknown as FocusSessionStatic))
      break;
      case UpdateType.DELETE:
        delete TIMERS[data]
      break;
    }
  }
})