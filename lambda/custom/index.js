/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core')

const { stateIs, intentIs, greeting, whatNext } = require('./util.js')
const { NotificationQueue } = require('./notifications')
const { addNotifications } = require('./add-notifications')
const { Context } = require('./context')
const { ATTR, STATE, CONST } = require('./constants')

var queue = new NotificationQueue()
addNotifications(queue)

var context

const RequestInterceptor = {
  process(handlerInput) {
    context = new Context()
    // copy the attributes into context
    context.setAttributes(handlerInput.attributesManager.getSessionAttributes())
    // have the queue load the current position from the attributes
    queue.loadFrom(context.getAttributes())
  }
}

const ResponseInterceptor = {
  process(handlerInput, response) {
    // have the queue save it's current position to the context
    queue.saveTo(context)
    // copy the attributes from context to the session attributes
    handlerInput.attributesManager.setSessionAttributes(context.getAttributes())
  }
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === CONST.LAUNCH_REQUEST
  },
  handle(handlerInput) {
    // Alexa is having a serious problem recognizing PINS right now. I even tried it on older projects
    // that have been used for months, and the PIN intent (AMAZON.FOUR_DIGIT_NUMBER) is not recognized.
    // This is temporary
    context.setAttribute(ATTR.WAS_PIN_ENTERED, true)

    context.speak(`${greeting()} ${CONST.NAME}.`)
    queue.getNotificationNumberText(context)
    queue.startNotification(handlerInput.requestEnvelope.request, context)
    return context.getResponse(handlerInput)
  }
}

const PlayNotificationsHandler = {
  canHandle(handlerInput) {
    return intentIs(handlerInput, CONST.NOTIFICATIONS_INTENT)
  },
  handle(handlerInput) {
    queue.getNotificationNumberText(context)
    queue.startNotification(handlerInput.requestEnvelope.request, context)
    if (!context.done()) {
      queue.askAboutNextNotification(context)
    }
    return context.getResponse(handlerInput)
  }
}

const PinHandler = {
  canHandle(handlerInput) {
    return stateIs(handlerInput, STATE.WAITING_FOR_PIN) && intentIs(handlerInput, CONST.PIN_INTENT)
  },
  handle(handlerInput) {
    // any 4 digit pin starting with 1 will be accepted
    if (handlerInput.requestEnvelope.request.intent.slots.pin.value[0] !== '1') {
      context.speakReprompt(`I'm sorry. That pin is not correct. Please say the PIN again.`)
      return context.getResponse(handlerInput)
    }
    context.setAttribute(ATTR.WAS_PIN_ENTERED, true)
    queue.startNotification(handlerInput.requestEnvelope.request, context)
    if (!context.done()) {
      queue.askAboutNextNotification(context)
    }
    return context.getResponse(handlerInput)
  }
}

const NotificationExecutionHandler = {
  canHandle(handlerInput) {
    let currentNotification = queue.active()
    return (currentNotification !== null)
  },
  handle(handlerInput) {
    queue.execute(handlerInput.requestEnvelope.request, context)
    if (!context.done()) {
      queue.askAboutNextNotification(context)
    }
    return context.getResponse(handlerInput)
  }
}

const RecipeHandler = {
  canHandle(handlerInput) {
    return intentIs(handlerInput, CONST.RECIPE_INTENT)
  },
  handle(handlerInput) {
    // diabetes intentionally misspelled to help pronunciation without going phonetic
    let speech = `Okay. You patient health record recommends eating a low-sugar diet.
                  | I have a few recipes recommended by the American Diabetease Association.
                  | Would you like the recipe for Sweet and Savory Spiralized Zucchini Noodles?`.stripMargin()

    context.speakReprompt(speech, 'Want the recipe for Sweet and Savory Spiralized Zucchini Noodles?')

    context.setState(STATE.HEAR_RECIPE)
    context.setAttribute(ATTR.RECIPE, 'Sweet and Savory Spiralized Zucchini Noodles')

    return context.getResponse(handlerInput)
  }
}

const SpecificRecipeHandler = {
  canHandle(handlerInput) {
    return stateIs(handlerInput, STATE.HEAR_RECIPE)
  },
  handle(handlerInput) {
    if (intentIs(handlerInput, "AMAZON.YesIntent")) {
      context.speak("Okay. I've sent a card with the recipe on it and I've added the ingredients to your Alexa shopping list.")

      let cardText = `1 Zucchini
                      |1 Savory sauce
                      |
                      |Spiralize the Zucchini into noodles
                      |Add the sauce`.stripMargin()

      context.card(context.getAttribute(ATTR.RECIPE), cardText)
    } else {
      context.speak("As you wish!")
    }

    queue.askAboutNextNotification(context)

    return context.getResponse(handlerInput)
  }
}

const HearNextNotificationHandler = {
  canHandle(handlerInput) {
    return stateIs(handlerInput, STATE.HEAR_NEXT_NOTIFICATION)
  },
  handle(handlerInput) {
    if (intentIs(handlerInput, CONST.YES_INTENT)) {
      queue.startNotification(handlerInput.requestEnvelope.request, context)
      if (!context.done()) {
        queue.askAboutNextNotification(context)
      }
    } else if (intentIs(handlerInput, CONST.NO_INTENT)) {
      context.speak("Okay.")
      context.speakReprompt(whatNext(), "What next?")
      context.setState(STATE.NULL)
    } else {
      // if user has another intent, that handler should match first
      let speech = `Hmm. I didn't get that. Please say yes or no or make another request. 
                    | Would you like to hear the next notification?`.stripMargin()
      context.speakReprompt(speech, "Do you want to hear the next notification?")
    }

    return context.getResponse(handlerInput)
  }
}

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return intentIs(handlerInput, 'AMAZON.HelpIntent');
  },
  handle(handlerInput) {
    const speechText = 'There is no help message for now. You\'re on your own!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
}

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withShouldEndSession(true)
      .getResponse();
  },
}

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
}

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Will you please say it again?')
      .reprompt('Sorry, I can\'t understand the command. Will you please say it again?')
      .getResponse();
  },
}

const configureBuilder = () => {
  const skillBuilder = Alexa.SkillBuilders.custom()
  skillBuilder
    .addRequestHandlers(
      SessionEndedRequestHandler,
      CancelAndStopIntentHandler,
      HelpIntentHandler,
      LaunchRequestHandler,
      PinHandler,
      RecipeHandler,
      SpecificRecipeHandler,
      PlayNotificationsHandler,
      NotificationExecutionHandler,
      HearNextNotificationHandler
    )
    .addRequestInterceptors(RequestInterceptor)
    .addResponseInterceptors(ResponseInterceptor)
    .addErrorHandlers(ErrorHandler)

  return skillBuilder
}

let skill

exports.handler = async (event, context, callback) => {
  console.log(`EVENT: ${JSON.stringify(event, null, 2)}`)

  if (!skill) {
    skill = configureBuilder().create()
  }

  try {
    let response = await skill.invoke(event, context)
    console.log(`RESPONSE: ${JSON.stringify(response, null, 2)}`)
    if (callback) {
      callback(null, response)
    }
    return response
  } catch (err) {
    console.log(`ERROR: ${err}`)
    if (callback) {
      callback(err, null)
    } else {
      throw err
    }
  }
}