
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

      if (notification.personal && !context.getAttribute(CONST.PIN_ENTERED)) {
        let speak = `Your first notification has personal information. 
                      | Please say your Blue Shield 4-digit pin if you would like to hear it now, 
                      | or continue with a question.`.stripMargin()
        context.speakReprompt(speak, 'Please say you PIN.')
        context.setState(STATE.WAITING_FOR_PIN)
        return
      }

      // we have a notification and the PIN is not required or has already been entered. 
      // Begin execution of the notification.
      context.setAttribute('path', '0')
      this.execute(context)
      return
    }
  }

  execute(context) {
    let notification = this.peek()
    let list = lists[notification.type](notification)
    

  }
}

const appointmentList = (item) => {
  const { type, date, time } = item.detail
  const list = [
    {
      when: { state: STATE.NULL },
      then: {
        speak: `You have an ${type} appointment ${date} at ${time}. Would you like me to set a reminder?`,
        reprompt: 'Shall I set a reminder?',
        setState: STATE.SET_REMINDER
      }
    },
    {
      when: {
        state: STATE.SET_REMINDER,
        intent: CONST.YES_INTENT
      },
      then: {
        speak: "OK, I've created a reminder."
      }
    },
    {
      when: {
        state: STATE.SET_REMINDER,
        intent: CONST.NO_INTENT
      },
      then: {
        speak: 'OK.'
      }
    }
  ]

  return list
}


const refillList = (item) => {
  const { med, pharmacy } = item.detail
  const list = [
    {
      when: { state: STATE.NULL },
      then: {
        speak: `I noticed in your patient health record that you have a prescription
                | for ${med.name}, ready for refill on ${med.readyDate}.
                | It was last refilled at ${pharmacy.name} at ${pharmacy.address.street}, ${pharmacy.address.city}.
                | There are ${med.refillsAvailable} more refills available.
                | Would you like me to help you refill this prescription?`.stripMargin(),
        reprompt: `Would you like me to order a refill for ${med.name} at ${pharmacy.name} at ${pharmacy.address.street}?`,
        setState: STATE.ORDER_REFILL
      }
    },
    {
      when: {
        state: STATE.ORDER_REFILL,
        intent: CONST.YES_INTENT
      },
      then: {
        speak: `Okay. This prescription will be refilled at the same location. 
              | But, since this is a routine prescription, you might want to change your prescription
              | to a mail order pharmacy. Would you like to hear more about this?`.stripMargin(),
        reprompt: 'Would you like to hear more about mail order prescriptions?',
        setState: STATE.HEAR_ABOUT_MAIL_ORDER
      }
    },
    {
      when: {
        state: STATE.ORDER_REFILL,
        intent: CONST.NO_INTENT
      },
      then: {
        speak: 'Okay.'
      }
    },
    {
      when: {
        state: STATE.HEAR_ABOUT_MAIL_ORDER,
        intent: CONST.YES_INTENT
      },
      then: {
        speak: 'Sorry, I have not yet been programmed to tell you abour mail order pharmacies yet.',
        jump: {intent: CONST.NO_INTENT}
      },
    },
    {
      when: {
        state: STATE.HEAR_ABOUT_MAIL_ORDER,
        intent: CONST.NO_INTENT
      },
      then: {
        speak: `I've placed your refill order and it should be ready for pickup on ${med.readyDate}.
                | I've also sent a card with the pharmacy address and prescription information.
                | Would you like me to create a reminder for ${med.readyDate} to pick up the prescription?`.stripMargin(),
        reprompt: 'Would you like me to create a reminder to pick up the prescription?',
        cardTitle: 'Prescription',
        cardText: `Your refill prescription for ${med.name} should be ready on ${med.readyDate} at:
                  |${pharmacy.name}
                  |${pharmacy.address.street}
                  |${pharmacy.address.city}, ${pharmacy.address.state}, ${pharmacy.address.zip}
                  |
                  |Phone: ${pharmacy.phone}
                  |
                  |Your prescription number is: ${med.prescriptionNumber}`.stripMargin(),
        setState: STATE.CREATE_SCRIP_REMINDER
      }
    },
    {
      when: {
        state: STATE.CREATE_SCRIP_REMINDER,
        intent: CONST.YES_INTENT
      },
      then: {
        speak: "OK, I've created a reminder to pick up the prescription."
      }
    },
    {
      when: {
        state: STATE.CREATE_SCRIP_REMINDER,
        intent: CONST.NO_INTENT
      },
      then: {
        speak: 'OK.'
      }
    }
  ]
  return list 
}

const announcementList = (item) => {
  const { message } = item.detail
  const list = [
    {
      when: { state: STATE.NULL },
      then: {
        speak: message
      }
    }
  ]
  return list
}

const lists = {
  'appointment': appointmentList,
  'refill': refillList,
  'announcement': announcementList
}

exports.NotificationQueue = NotificationQueue
