import { IntentRequest } from 'ask-sdk-model';
import { AlexaNotification, notificationList, NotificationType } from './notification-data'
import { Rule, getRules, When } from './notification-language'
import { Context } from './context'
import { whatNext } from './utils'
import {
  ATTR_Q_FRONT, 
  ATTR_Q_CURRENT, 
  STATE_NULL, 
  ATTR_WAS_PIN_ENTERED, 
  STATE_HEAR_NEXT_NOTIFICATION
} from './constants'


export class NotificationQueue {
  private readonly _context: Context
  private readonly _queue: AlexaNotification[]
  private _front: number = 0
  private _current: number = -1

  constructor(context: Context) {
    this._context = context
    this._queue = []
    this.add(...notificationList)
    this.loadState()
  }

  add(...items: AlexaNotification[]) {
    this._queue.push(...items)
  }

  loadState() {
    this._front = this._context.getNumericAttribute(ATTR_Q_FRONT, 0)
    this._current = this._context.getNumericAttribute(ATTR_Q_CURRENT, -1)
  }

  saveState(attributes: { [s: string]: string }) {
    attributes[ATTR_Q_FRONT] = this._front.toString()
    attributes[ATTR_Q_CURRENT] = this._current.toString()
  }

  get length() {
    return this._queue.length - this._front
  }

  dequeue() {
    if (this.length) {
      this._current = this._front
      this._front++
      return
    }

    throw new Error("Tried to dequeue() an empty notification queue.")
  }

  current() {
    if (this._current >= 0 && this._current < this._queue.length) {
      return this._queue[this._current]
    }
    return null
  }

  peek() {
    return this._queue[this._front]
  }

  getNotificationNumberText() {
    if (this.length > 1) {
      this._context.speak(`You have ${this.length} notifications.`)
      return
    }

    if (this.length <= 0) {
      this._context.speak('You do not have any notifications.')
      return
    }

    this._context.speak('You have 1 notification.')
  }

  startNotification() {
    this.checkForPinRequired()
    if (this._context.isDone()) {
      return
    }
    this.dequeue()
    this._context.setState(STATE_NULL)
    this.execute()
  }

  checkForPinRequired() {
    // if the PIN has not been given and the first item is personal, we need to ask for the PIN
    if (this.length) {
      let notification = this.peek()
      if (notification.personal && ! this._context.getBooleanAttribute(ATTR_WAS_PIN_ENTERED)) {
        let pronoun = this.length > 1 ? 'them' : 'it'
        this._context.speakReprompt(`Please tell me your Blue Shield 4-digit pin if you would like to hear ${pronoun} now.`,
          'Please say your PIN.')
      }
    }
  }

  isMatch(rule: Rule) {
    let test = (key: keyof When) : boolean => {
      const value = rule.when[key]
      switch(key) {
        case 'state': 
          return this._context.getState() === value
        case 'intent':
          return (<IntentRequest>this._context.handlerInput.requestEnvelope.request).intent.name === value
        default:
          throw new Error(`invalid key in isMatch: ${key}`)
      }
    }

    // if there is no elements in the when section, the rules is only used as a target for a jump
    if (Object.keys(rule.when).length === 0) {
      if (! rule.ruleId) {
        throw new Error("rule with no when elements should have a ruleId")
      }
      return false
    }

    // return true if every when element is true
    let result = Object.keys(rule.when).every(k => test(k as keyof When))
    return result
  }

  action(key: string, value: any, jump: (target: string) => void) {
    switch(key) {
      case 'speak': 
        this._context.speak(value)
        break
      case 'reprompt':
        this._context.reprompt(value)
        break
      case 'card':
        this._context.card(value)
        break
      case 'setState':
        this._context.setState(value)
        break
      case 'jump':
        jump(value)
        break
      default:
        throw new Error(`invalid then key: ${key}`)
    }
  }

  execute() {
    let notification = this._queue[this._current]
    let list = getRules(notification)
    // find the first element in the list where all of the match predicates are true
    let rule = list.find(rule => this.isMatch(rule))
    if (!rule) {
      throw new Error("No rule match found")
    }

    // If the when list includes a jump action, then #action will call the jump function to record the jump target.
    // This ensures that all other actions are executed before the jump (and it's easier to handle the jump here)
    let _jump : string = ''
    let jump = (jump: string) => {
      if (_jump) {
        throw new Error("_jump is already set - can't handle multiple jumps")
      }
      _jump = jump
    }

    // now execute all of the actions in the then object
    for (const [key, value] of Object.entries(rule.then)) {
      this.action(key, value, jump)
    }

    if (_jump) {
      // a jump was executed. Find the target rule and execute all of it's actions
      rule = list.find(rule => rule.ruleId === _jump)
      if (!rule) {
        throw new Error(`target of jump not found for ruleId: ${_jump}`)
      }
      for (const [key, value] of Object.entries(rule.then)) {
        this.action(key, value, jump)
      }      
    }

    // if there is no reprompt, the execution of the notification is over
    if (!this._context.isDone()) {
      this._current = -1
    }
  }

  askAboutNextNotification() {
    if (! this._context.isDone()) {
      if (this.length) {
        let speech = `Your next notification is ${this.getTypeText()}. Would you like to hear it now?`
        this._context.speakReprompt(speech, "Do you want to hear the next notification?")
        this._context.setState(STATE_HEAR_NEXT_NOTIFICATION)
      } else {
        this._context.speak('You have no more notifications.')
        this._context.speakReprompt(whatNext(), "What next?")
      }
    }
  }

  getTypeText() {
    let notification = this.peek()
    switch (notification.type) {
      case NotificationType.Appointment:
        return 'about an appointment'
      case NotificationType.Refill:
        return 'about a medication refill'
      case NotificationType.Announcement:
        return 'an announcement'
    }
  }
}

