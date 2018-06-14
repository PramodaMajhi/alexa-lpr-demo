
require('./util.js') // required for String.prototype.stripMargin
const { STATE, CONST } = require('./constants')

// If we were to persist the notification queue, then length, take, peek, etc.
// would work as expected. 
//
// Since we are stateless, the NotificationQueue will hold the entire list of
// notifications for all calls. We'll store the index of the top notification in
// attributes. See #load and #save.

class NotificationQueue {
  constructor() {
    this.queue = []
    this.index = 0
  }

  add(item) {
    this.queue.push(item)
  }

  loadFrom(attributes) {
    this.index = attributes.queueIndex || 0
  }

  saveTo(context) {
    context.setAttribute('index', this.index)
  }

  get length() {
    return this.queue.length - this.index
  }

  take() {
    let entry = this.queue[this.index++]
  }

  peek() {
    return this.queue[this.index]
  }

  getNotificationNumberText() {
    if (this.queue.length <= 1) {
      return 'You do not have any notifications.'
    }
    if (this.queue.length > 1) {
      return `You have ${this.length} notifications.`
    }
    return 'You have 1 notification.'
  }

  getNotificationText(context) {
    // if the PIN has not been given and the first item is personal, we need to ask for the PIN
    if (this.length) {
      let notification = this.peek()

      if (notification.personal && ! context.getAttribute(CONST.PIN_ENTERED)) {
        let speak =   `Your first notification has personal information. 
                      | Please say your Blue Shield 4-digit pin if you would like to hear it now, 
                      | or continue with a question.`.stripMargin()  
        context.speakReprompt(speak, 'Please say you PIN.')
        context.setState(STATE.WAITING_FOR_PIN)
        return
      }

      // we have a notification and the PIN is not required or has already been entered. 
      // Begin execution of the notification.
      context.setAttribute("path", "0")
      this.execute(context)
      return
    }
  }

  execute(context) {
    let notification = this.peek()
    let tree = trees[notification.type](notification)
    let path = context.getAttribute("path")

  }
}

const appointmentTree = (item) => {
  const { type, date, time } = item.detail
  const list = [
    {
      speech: `You have an ${type} appointment ${date} at ${time}. Would you like me to set a reminder?`
    },
    {
      reprompt: "Shall I set a reminder?"
    },
    {
      branches: {
        "AMAZON.YesIntent": [{ speech: "OK, I've created a reminder." }],
        "AMAZON.NoIntent": [{ speech: "OK" }]
      }
    }
  ]
  return list
}


const refillTree = (item) => {
  const { med, pharmacy } = item.detail
  const list = [
    {
      speech: `I noticed in your patient health record that you have a prescription
              | for ${med.name}, ready for refill on ${med.readyDate}.
              | It was last refilled at ${pharmacy.name} at ${pharmacy.address.street}, ${pharmacy.address.city}.
              | There are ${med.refillsAvailable} more refills available.
              | Would you like me to help you refill this prescription?`.stripMargin()
    },
    {
      reprompt: `Would you like me to order a refill for ${med.name} at ${pharmacy.name} at ${pharmacy.address.street}?`
    },
    {
      branches: {
        "AMAZON.YesIntent": [
          {
            speech: `Okay. This prescription will be refilled at the same location. 
                      | But, since this is a routine prescription, you might want to change your prescription
                      | to a mail order pharmacy. Would you like to hear more about this?`.stripMargin()
          },
          {
            reprompt: 'Would you like to hear more about mail order prescriptions?'
          },
          {
            branches: {
              "AMAZON.YesIntent": [
                { speech: "Sorry, I have not yet been programmed to tell you abour mail order pharmacies yet." },
                { jump: "AMAZON.NoIntent" }
              ],
              "AMAZON.NoIntent": [
                {
                  speech: `I've placed your refill order and it should be ready for pickup on ${med.readyDate}.
                              | I've also sent a card with the pharmacy address and prescription information.
                              | Would you like me to create a reminder for ${med.readyDate} to pick up the prescription?`.stripMargin()
                },
                {
                  reprompt: 'Would you like me to create a reminder to pick up the prescription?'
                },
                {
                  card: `Your refill prescription for ${med.name} should be ready on ${med.readyDate} at:
                              |${pharmacy.name}
                              |${pharmacy.address.street}
                              |${pharmacy.address.city}, ${pharmacy.address.state}, ${pharmacy.address.zip}
                              |
                              |Phone: ${pharmacy.phone}
                              |
                              |Your prescription number is: ${med.prescriptionNumber}`.stripMargin()
                },
                {
                  branches: {
                    "AMAZON.YesIntent": [
                      { speech: "OK, I've created a reminder to pick up the prescription." }
                    ],
                    "AMAZON.NoIntent": [
                      { speech: "OK." }
                    ]
                  }
                }
              ]
            }
          }
        ]
      },
      "AMAZON.NoIntent": [{ speech: 'OK' }]
    }
  ]
  return list
}

const announcementTree = (item) => {
  const { message } = item.detail
  const list = [
    {
      speech: message
    }
  ]
  return list
}

const trees = {
  'appointment': appointmentTree,
  'refill': refillTree,
  'announcement': announcementTree
}

exports.NotificationQueue = NotificationQueue
