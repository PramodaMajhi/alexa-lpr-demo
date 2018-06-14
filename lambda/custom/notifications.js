const { whatNext } = require('./util.js') // also equired for String.prototype.stripMargin
const { ATTR, STATE, CONST } = require('./constants')

// If we were to persist the notification queue, or run on a server, 
// then length, take, peek, etc. would work as expected. 
//
// Since we are stateless and running in Lambda, the NotificationQueue will hold the entire list of
// notifications. The index of the head and the current notification will be saved in attributes.
// See #loadFrom and #saveTo.

class NotificationQueue {
  constructor() {
    this.queue = []
    this.head = 0
    // current is set to the index of the notification being executed while it is being executed
    this.current = -1
  }

  add(item) {
    this.queue.push(item)
  }

  loadFrom(attributes) {
    this.head = attributes[ATTR.Q_HEAD] || this.head
    this.current = attributes[ATTR.Q_CURRENT]
    if (this.current === undefined) {
      this.current = -1
    }
  }

  saveTo(context) {
    context.setAttribute(ATTR.Q_HEAD, this.head)
    context.setAttribute(ATTR.Q_CURRENT, this.current)
  }

  get length() {
    return this.queue.length - this.head
  }

  next() {
    if (this.length) {
      this.current = this.head
      this.head++
      return
    }
    throw new Error("Tried to next() an empty notification queue.")
  }

  active() {
    if (this.current >= 0 && this.current < this.queue.length) {
      return this.queue[this.current]
    }
    return null
  }

  peek() {
    return this.queue[this.head]
  }

  getNotificationNumberText(context) {
    if (this.length > 1) {
      context.speak(`You have ${this.length} notifications.`)
      return
    }

    if (this.length <= 0) {
      context.speak('You do not have any notifications.')
      return
    }
    
    context.speak('You have 1 notification.')
  }

  startNotification(request, context) {
    // remember - a pin could be required before any notification if it is the first private notification
    this.checkForPinRequired(context)
    if (context.done()) {
      return
    }
    this.next()
    context.setState(STATE.NULL)
    this.execute(request, context)
  }

  checkForPinRequired(context) {
    // if the PIN has not been given and the first item is personal, we need to ask for the PIN
    if (this.length) {
      let notification = this.peek()
      if (notification.personal && !context.getAttribute(ATTR.WAS_PIN_ENTERED)) {
        let pronoun = this.length > 1 ? 'them' : 'it'
        context.speakReprompt(`Please tell me your Blue Shield 4-digit pin if you would like to hear ${pronoun} now.`,
                              'Please say your PIN.')
        context.setState(STATE.WAITING_FOR_PIN)
      }
    }
  }

  askAboutNextNotification(context) {
    if (! context.done()) {
      if (this.length) {
        let speech = `Your next notification is ${this.getTypeText()}. Would you like to hear it now?`
        context.speakReprompt(speech, "Do you want to hear the next notification?")
        context.setState(STATE.HEAR_NEXT_NOTIFICATION)
      } else {
        context.speak('<break time="100ms"/>There are no more notifications.')
        context.speakReprompt(whatNext(), "What next?")
      }
    }
  }

  isMatch(whenThen, request, context) {
    let test = (e) => {
      let key = e[0]
      let value = e[1]
      switch(key) {
        case 'state': 
          return context.getState() === value
        case 'intent':
          return request.intent.name === value
        default:
          throw new Error(`invalid key in list match: ${key}`)
      }
    }

    // if there is no elements in the when section, the rules is only used as a target for a jump
    if (Object.entries(whenThen.when).length === 0) {
      if (! whenThen.ruleId) {
        throw new Error("rule with no when elements should have a ruleId")
      }
      return false
    }

    // return true if every when element is true
    let result = Object.entries(whenThen.when).every(test)
    return result
  }

  action([key, value], context, jump) {
    switch(key) {
      case 'speak': 
        context.speak(value)
        break
      case 'reprompt':
        context.reprompt(value)
        break
      case 'card':
        context.card(value.title, value.text)
        break
      case 'setState':
        context.setState(value)
        break
      case 'jump':
        jump(value)
        break
      default:
        throw new Error(`invalid then key: ${key}`)
    }
  }

  execute(request, context) {
    let notification = this.queue[this.current]
    let list = lists[notification.type](notification)
    // find the first element in the list where all of the match predicates are true
    let whenThen = list.find(whenThen => this.isMatch(whenThen, request, context))
    if (!whenThen) {
      throw new Error("No match found")
    }

    // if the actions include a jump action, it will call the jump function to record the jump target
    // this ensures that all other actions are executed before the jump (and it's easier to handle the jump here)
    let _jump = null
    let jump = (jump) => {
      if (_jump) {
        throw new Error("Cannot handle multiple jumps")
      }
      _jump = jump
    }

    // now execute all of the actions in the then object
    Object.entries(whenThen.then).forEach(entry => this.action(entry, context, jump))

    if (_jump) {
      // a jump was executed. Find the target rule and execute all of it's actions
      whenThen = list.find(whenThen => whenThen.ruleId === _jump)
      if (!whenThen) {
        throw new Error(`target of jump not found for ruleId: ${_jump}`)
      }
      Object.entries(whenThen.then).forEach(entry => this.action(entry, context, jump))
    }
    
    // if there is no reprompt, the execution of the notification is over
    if (!context.done()) {
      this.current = -1
    }
  }

  getTypeText() {
    let notification = this.peek()
    switch (notification.type) {
      case 'appointment':
        return 'about an appointment'
      case 'refill':
        return 'about a medication refill'
      case 'announcement':
        return 'an announcement'
    }
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
        setState: STATE.SET_APPT_REMINDER
      }
    },
    {
      when: {
        state: STATE.SET_APPT_REMINDER,
        intent: CONST.YES_INTENT
      },
      then: {
        speak: "Okay. I've created a reminder."
      }
    },
    {
      when: {
        state: STATE.SET_APPT_REMINDER,
        intent: CONST.NO_INTENT
      },
      then: {
        speak: 'Okay.'
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
              | to a mail order pharmacy which could help you save money. Would you like to hear more about this?`.stripMargin(),
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
        speak: 'As you wish.'
      }
    },
    {
      when: {
        state: STATE.HEAR_ABOUT_MAIL_ORDER,
        intent: CONST.YES_INTENT
      },
      then: {
        speak: 'Mail order pharmacies are <emphasis level="strong">great!</emphasis>.',
        jump: '3ae27b6d'
      },
    },
    {
      when: {
        state: STATE.HEAR_ABOUT_MAIL_ORDER,
        intent: CONST.NO_INTENT
      },
      then: {
        speak: 'Okay.',
        jump: '3ae27b6d'
      },
    },
    {
      ruleId: '3ae27b6d',
      when: {
        // when the when is empty, the rule can never be matched, only jumped to
      },
      then: {
        speak: `I've completed your refill request and it should be ready for pickup on ${med.readyDate} at ${med.readyTime}.
                | I've also sent a card with the pharmacy address and prescription information.
                | Would you like me to set a reminder to pick up your prescription?`.stripMargin(),
        reprompt: 'Would you like me to create a reminder to pick up your prescription?',
        card: {
                title: 'Prescription', 
                text: `Your refill prescription for ${med.name} should be ready on ${med.readyDate} at ${med.readyTime} at:
                      |${pharmacy.name}
                      |${pharmacy.address.street}
                      |${pharmacy.address.city}, ${pharmacy.address.state}, ${pharmacy.address.zip}
                      |
                      |Phone: ${pharmacy.phone}
                      |
                      |Your prescription number is: ${med.prescriptionNumber}`.stripMargin()
        },
        setState: STATE.CREATE_PICKUP_SCRIP_REMINDER
      }
    },
    {
      when: {
        state: STATE.CREATE_PICKUP_SCRIP_REMINDER,
        intent: CONST.YES_INTENT
      },
      then: {
        speak: `Done. Your reminder is set for ${med.readyDate} at ${med.readyTime}.`,
        jump: 'd0386017'
      }
    },
    {
      when: {
        state: STATE.CREATE_PICKUP_SCRIP_REMINDER,
        intent: CONST.NO_INTENT
      },
      then: {
        speak: 'Okay.',
        jump: 'd0386017'
      }
    },
    {
      ruleId: 'd0386017',
      when: {},
      then: {
        speak: `I also see you should take this medicine 2 times per day. 
               | Would you like me to remind you each morning and evening?`.stripMargin(),
        reprompt: 'Shall I set a reminder to take your medicine?',
        setState: STATE.CREATE_TAKE_SCRIPT_REMINDER
      }
    },
    {
      when: {
        state: STATE.CREATE_TAKE_SCRIPT_REMINDER,
        intent: CONST.YES_INTENT
      },
      then: {
        speak: `I've created a reminder each morning and evening to take your medicine.`
      }
    },
    {
      when: {
        state: STATE.CREATE_TAKE_SCRIPT_REMINDER,
        intent: CONST.NO_INTENT
      },
      then: {
        speak: 'As you wish!'
      }
    }
  ]
  return list
}

const announcementList = (item) => {
  const { message } = item.detail
  const list = [
    {
      when: { 
        state: STATE.NULL 
      },
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
