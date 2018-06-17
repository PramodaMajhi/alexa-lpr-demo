// When using the Alexa SDK builder, the call to speak() must include all of the speech.
// However, we want to build up the speech across many different functions, so it's best to maintain
// our own string. The Context is just a wrapper for these common strings, and the attributes.

import * as Alexa from 'ask-sdk-core'
import { NotificationQueue } from './notification-queue';
import { ATTR_STATE } from './constants';
import { Response } from 'ask-sdk-model';

type Attributes = { [key: string]: string }
type Card = {
  title: string,
  text: string
}

export class Context {
  private _handlerInput: Alexa.HandlerInput
  private _attributes: Attributes
  private _notificationQueue: NotificationQueue | null
  private _speak: string
  private _reprompt: string
  private _card: Card | null
  private _shouldEndSession: boolean

  constructor(handlerInput: Alexa.HandlerInput) {
    this._handlerInput = handlerInput
    this._attributes = handlerInput.attributesManager.getSessionAttributes()
    this._notificationQueue = null

    this._speak = ''
    this._reprompt = ''
    this._card = null,
    this._shouldEndSession = false
  }

  // After creating a new context, then call createQueue
  // 
  // example:
  //  let context = new Context()
  //  context.createQueue()
  //
  // It may have been possible to construct the NotificationQueue in the constructor, but then
  // we would be passing a partially constrcuted Context to the NotificationQueue constructor.
  createQueue() {
    this._notificationQueue = new NotificationQueue(this)
  }

  get queue() : NotificationQueue {
    if (this._notificationQueue === null) {
      throw new Error("NotificationQueue is null")
    }
    return this._notificationQueue
  }

  get handlerInput() {
    return this._handlerInput
  }
  
  speak(text: string) {
    this._speak += text + ' '
  }

  reprompt(text: string) {
    this._reprompt = text
  }

  card(card: Card) {
    this._card = card
  }
  speakReprompt(text: string, reprompt: string) {
    this.speak(text)
    this.reprompt(reprompt)
  }

  setAttributes(attr: Attributes) {
    this._attributes = attr
  }

  getAttributes(): Attributes {
    return this._attributes
  }

  setAttribute(key: string, value: string | number | boolean) {
    this._attributes[key] = value.toString()
  }

  getStringAttribute(key: string): string {
    return this._attributes[key]
  }

  getNumericAttribute(key: string, def: number): number {
    if (key in this._attributes) {
      return parseInt(this._attributes[key], 10)
    }
    return def
  }

  getBooleanAttribute(key: string, def: boolean): boolean {
    if (key in this._attributes) {
      return this._attributes[key] === 'true'
    }
    return def
  }

  setState(state: string) {
    this.setAttribute(ATTR_STATE, state)
  }

  getState() {
    return this.getStringAttribute(ATTR_STATE)
  }

  isDone() {
    // if reprompt has been set, then we've asked a question
    return this._reprompt !== ''
  }

  getResponse() : Response {
    // save the attributes back to the session
    this._handlerInput.attributesManager.setSessionAttributes(this.getAttributes())

    let builder = this._handlerInput.responseBuilder
    if (this._speak) {
      builder.speak(this._speak)
    }
    if (this._reprompt) {
      builder.reprompt(this._reprompt)
    }
    if (this._card) {
      builder.withSimpleCard(this._card.title, this._card.text)
    }
    if (this._shouldEndSession) {
      builder.withShouldEndSession(true)
    }
    return builder.getResponse()
  }
}
