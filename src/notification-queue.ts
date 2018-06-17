import { Request, IntentRequest } from 'ask-sdk-model';
import { AlexaNotification, notificationList } from './notification-data'
import { Rule, getRules, When, Then } from './notification-language'
import { Context } from './context'
import {
  ATTR_Q_FRONT,
  ATTR_Q_CURRENT,
  STATE_NULL,
  ATTR_WAS_PIN_ENTERED,
  STATE_WAITING_FOR_PIN
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
    this.loadState(this._context)
  }

  add(...items: AlexaNotification[]) {
    this._queue.push(...items)
  }

  loadState(context: Context) {
    this._front = context.getNumericAttribute(ATTR_Q_FRONT, 0)
    this._current = context.getNumericAttribute(ATTR_Q_FRONT, -1)
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

  getNotificationNumberText(context: Context) {
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

  startNotification(context: Context) {
    this.checkForPinRequired(context)
    if (context.isDone()) {
      return
    }
    this.dequeue()
    context.setState(STATE_NULL)
    this.execute(context)
  }

  checkForPinRequired(context: Context) {
    // if the PIN has not been given and the first item is personal, we need to ask for the PIN
    if (this.length) {
      let notification = this.peek()
      if (notification.personal && !context.getBooleanAttribute(ATTR_WAS_PIN_ENTERED, false)) {
        let pronoun = this.length > 1 ? 'them' : 'it'
        context.speakReprompt(`Please tell me your Blue Shield 4-digit pin if you would like to hear ${pronoun} now.`,
          'Please say your PIN.')
        context.setState(STATE_WAITING_FOR_PIN)
      }
    }
  }

  isMatch(context: Context, rule: Rule) {
    let test = (key: keyof When) : boolean => {
      const value = rule.when[key]
      switch(key) {
        case 'state': 
          return context.getState() === value
        case 'intent':
          return (<IntentRequest>context.handlerInput.requestEnvelope.request).intent.name === value
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

  action(context: Context, key: string, value: any, jump: (target: string) => void) {
    switch(key) {
      case 'speak': 
        context.speak(value)
        break
      case 'reprompt':
        context.reprompt(value)
        break
      case 'card':
        context.card(value)
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

  execute(context: Context) {
    let notification = this._queue[this._current]
    let list = getRules(notification)
    // find the first element in the list where all of the match predicates are true
    let rule = list.find(rule => this.isMatch(context, rule))
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
      this.action(context, key, value, jump)
    }

    if (_jump) {
      // a jump was executed. Find the target rule and execute all of it's actions
      rule = list.find(rule => rule.ruleId === _jump)
      if (!rule) {
        throw new Error(`target of jump not found for ruleId: ${_jump}`)
      }
      for (const [key, value] of Object.entries(rule.then)) {
        this.action(context, key, value, jump)
      }
      
    }

    // if there is no reprompt, the execution of the notification is over
    if (!context.isDone()) {
      this._current = -1
    }
  }
}
