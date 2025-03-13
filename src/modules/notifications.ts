import { SocketIO } from "./server";

export function fireNotification(payload: any) {
      SocketIO.emit("notification", payload);
  
      let webhooks = (process.env?.WEBHOOKS ? process.env?.WEBHOOKS.split("|") : [])
      webhooks.forEach((webhook: string) => {
        print("sending notification to webhook: ", webhook)
        fetch(webhook, {
          method: "POST",
          body: JSON.stringify(payload)
        })
      })
}