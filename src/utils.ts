import moment = require('./moment-timezone')

import { ATTR_STATE, INTENT_REQUEST } from './constants'
import { HandlerInput } from 'ask-sdk-core';

// for every line of a multi-line string, remove the characters fom the beginning of the line to the pipe character
String.prototype.stripMargin = function () {
  return this.replace(/^.*\|/gm, '')
}

export const stateIs = (handlerInput: HandlerInput, state: string) : boolean => {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes()
  const sessionState = sessionAttributes[ATTR_STATE]
  const result = (sessionState === state)
  return result
}

export const intentIs = (handlerInput: HandlerInput, intent: string) : boolean => {
  const result = handlerInput.requestEnvelope.request.type === INTENT_REQUEST
                 && handlerInput.requestEnvelope.request.intent.name === intent
  return result
}

export const greeting = () : string =>
{
  // Convert to local time in PxT and get the hour of the day as an int.
  // TODO: use the address API to get the address of the user and use the 
  // google geo and timezone APIs to get a timezone
  
  let dt = moment().tz("America/Los_Angeles")
  let hStr = dt.format('H')
  let h = parseInt(hStr, 10)

  if (h < 12) {
    return 'Good morning'
  }
  if (h < 17) {
    return 'Good afternoon'
  }
  if (h < 20) {
    return 'Good evening'
  }
  return 'Hello'
}

const whatNextResponses = [
  'What can I help you with next? ',
  'What next? ',
  'Please ask me a question. '
]

export const whatNext = () : string => {
  return whatNextResponses[Math.floor(Math.random() * whatNextResponses.length)];
}

//import {stateIs, intentIs, greeting, whatNext} = from './util.js'
