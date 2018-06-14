const moment = require('./moment-timezone')
const { ATTR, CONST } = require('./constants')

// for every line of a multi-line string, remove the characters fom the beginning of the line to the pipe character
String.prototype.stripMargin = function () {
  return this.replace(/^.*\|/gm, '')
}

const stateIs = (handlerInput, state) => {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes()
  const sessionState = sessionAttributes[ATTR.STATE]
  const result = (sessionState === state)
  return result
}

const intentIs = (handlerInput, intent) => {
  const result = handlerInput.requestEnvelope.request.type === CONST.INTENT_REQUEST
                 && handlerInput.requestEnvelope.request.intent.name === intent
  return result
}

const clearState = (handlerInput) => {
  handlerInput.attributesManager.setSessionAttributes({state: ''})
}

const greeting = () =>
{
  // Convert to local time in PxT and get the hour of the day as an int.
  // TODO: use the address API to get the address of the user and use the 
  // google geo and timezone APIs to get a timezone
  
  let dt = moment().tz("America/Los_Angeles")
  let hStr = dt.format('H')
  h = parseInt(hStr, 10)

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

const whatNext = () => {
  return whatNextResponses[Math.floor(Math.random() * whatNextResponses.length)];
}

module.exports.stateIs = stateIs
module.exports.intentIs = intentIs
module.exports.clearState = clearState
module.exports.greeting = greeting
module.exports.whatNext = whatNext

//const {stateIs, intentIs, clearState, greeting, whatNext} = require('./util.js')
