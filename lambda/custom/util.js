const moment = require('./moment-timezone')
const { ATTR, STATE, CONST } = require('./constants')

const stateIs = (handlerInput, state) => {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes()
  const sessionState = sessionAttributes[ATTR.STATE]
  const result = (sessionState === state)
  return result
}

module.exports.stateIs = stateIs

const intentIs = (handlerInput, intent) => {
  const result = handlerInput.requestEnvelope.request.type === CONST.INTENT_REQUEST
                 && handlerInput.requestEnvelope.request.intent.name === intent
  return result
}

module.exports.intentIs = intentIs

const clearState = (handlerInput) => {
  handlerInput.attributesManager.setSessionAttributes({state: ''})
}

module.exports.clearState = clearState

// for every line of a multi-line string, remove the characters fom the beginning of the line to the pipe character
String.prototype.stripMargin = function () {
  return this.replace(/^.*\|/gm, '')
}

const greeting = () =>
{
  // Convert to local time in PxT and get the hour of the day as an int.
  // ToDo: use the address API to get the address of the user and use the 
  // google geo and timezone APIs to get a timezone
  
  let dt = moment().tz("America/Los_Angeles")
  let hStr = dt.format('H')
  h = parseInt(hStr, 10)

  if (h < 12) {
    return 'Good morning'
  }
  if (h < 17) {
    return 'Good afternoo'
  }
  if (h < 20) {
    return 'Good evening'
  }
  return 'Hello'
}

module.exports.greeting = greeting

const whatNextResponses = [
  'What can I help you with next? ',
  'What next? ',
  'Please ask me a question. '
]

const whatNext = () => {
  return whatNextResponses[Math.floor(Math.random() * whatNextResponses.length)];
}

module.exports.whatNext = whatNext

//const {stateIs, intentIs, clearState, greeting, whatNext} = require('./util.js')
