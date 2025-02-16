import EventEmitter from "eventemitter3"

let thisSecond = () => Math.floor((Date.now()) / 1000) * 1000
let nextSecond = () => Math.floor((Date.now() + 1000) / 1000) * 1000

class IntervalClass extends EventEmitter {
  constructor() {
    super()
    let interval = () => {
      let timestamp = thisSecond()
      this.emit("second", timestamp)
      if (timestamp % 60000 == 0) { this.emit("minute", timestamp) }
    }
    // print(`Running In: ${nextMinute() - Date.now()}`)
    setTimeout(() => {
      interval()
      setInterval(() => {
        interval()
      }, 1000)
    }, nextSecond() - Date.now())
  }
}

export const Interval = new IntervalClass()