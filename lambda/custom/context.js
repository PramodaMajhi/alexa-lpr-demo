// When using the Alexa SDK builder, the call to speak() must include all of the speech.
// However, we want to build up the speach in multiple handlers, so it's best to maintain
// our own string. The Context is just a wrapper for these common strings, and the attributes.

const { ATTR, STATE, CONST } = require('./constants')

class Context {
  constructor() {
    this._attributes = {}
    this._speak = ''
    this._reprompt = ''
    this._cardTitle = ''
    this._cardText = ''
    this._shouldEndSession = false
  }

  speak(text) {
    this._speak += text + ' '
  }

  reprompt(text) {
    this._reprompt = text
  }

  speakReprompt(text, reprompt) {
    this.speak(text)
    this.reprompt(reprompt)
  }

  setAttributes(attr) {
    this._attributes = attr
  }

  getAttributes() {
    return this._attributes
  }

  setAttribute(key, value) {
    this._attributes[key] = value
  }

  getAttribute(key) {
    return this._attributes[key]
  }

  setState(value) {
    this.setAttribute(ATTR.STATE, value)
  }

  getState() {
    return this.getAttribute(ATTR.STATE)
  }

  done() {
    // if reprompt has been set, then we've asked a question and should not add any more speech
    return this._reprompt !== ''
  }
  
  card(title, text) {
    this._cardTitle = title
    this._cardText = text
  }

  getResponse(handlerInput) {
    let builder = handlerInput.responseBuilder
    if (this._speak) {
      builder.speak(this._speak)
    }
    if (this._reprompt) {
      builder.reprompt(this._reprompt)
    }
    if (this._cardTitle) {
      builder.withSimpleCard(this._cardTitle, this._cardText)
    }
    if (this._shouldEndSession) {
      builder.withShouldEndSession(true)
    }
    return builder.getResponse()
  }
}

exports.Context = Context