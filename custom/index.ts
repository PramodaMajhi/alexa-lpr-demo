// for every line of a multi-line string, remove the characters fom the beginning of the line to the pipe character
String.prototype.stripMargin = function () {
  return this.replace(/^.*\|/gm, '')
}

import * as Alexa from 'ask-sdk-core'
import { RequestEnvelope, IntentRequest, SessionEndedRequest } from 'ask-sdk-model'
import { Context } from './context'
import { greeting, stateIs, intentIs, whatNext } from './utils.js'
import {
  ATTR_WAS_PIN_ENTERED, LAUNCH_REQUEST, ATTR_Q_CURRENT, STATE_HEAR_NEXT_NOTIFICATION,
  YES_INTENT, NO_INTENT, STATE_NULL, RECIPE_INTENT, STATE_HEAR_RECIPE, ATTR_RECIPE,
  NOTIFICATIONS_INTENT, PIN_INTENT, STATE_CALL_RESTAURANT, FALLBACK_INTENT
} from './constants'

const CreateContext = (handlerInput: Alexa.HandlerInput) => {
  // Context holds a queue and the queue points back to the context and makes
  // calls into it. Not good form to call into an object while it's being constructed, 
  // so we make a separate call to createQueue().
  let context = new Context(handlerInput)
  context.createQueue()
  return context
}

const LaunchRequestHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === LAUNCH_REQUEST
  },
  handle(handlerInput) {
    let context = CreateContext(handlerInput)    

    // Alexa is having a serious problem recognizing PINS right now. I even tried it on older projects
    // that have been used for months, and the PIN intent (AMAZON.FOUR_DIGIT_NUMBER) is not recognized.
    // I hope this is temporary
    // context.setAttribute(ATTR_WAS_PIN_ENTERED, true)

    context.speak(greeting())
    context.queue.getNotificationNumberText()
    context.queue.startNotification()
    return context.getResponse()
  }
}

const PlayNotificationsHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return intentIs(handlerInput, NOTIFICATIONS_INTENT)
  },
  handle(handlerInput) {
    let context = CreateContext(handlerInput)
    context.queue.getNotificationNumberText()
    context.queue.startNotification()
    if (!context.isDone()) {
      context.queue.askAboutNextNotification()
    }
    return context.getResponse()
  }
}

const PinHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return intentIs(handlerInput, PIN_INTENT)
  },
  handle(handlerInput) {
    let context = CreateContext(handlerInput)
    // any 4 digit pin starting with 1 will be accepted
    let intent = (<IntentRequest>handlerInput.requestEnvelope.request).intent
    if (intent && intent.slots && intent.slots.pin.value[0] !== '1') {
      context.speakReprompt("I'm sorry. That pin is not correct. Please say the PIN again.", "Please say the PIN again")
      return context.getResponse()
    }
    context.speak(`Okay, great. That's right.`)
    context.setAttribute(ATTR_WAS_PIN_ENTERED, true)
    context.queue.startNotification()
    if (!context.isDone()) {
      context.queue.askAboutNextNotification()
    }
    return context.getResponse()
  }
}

const NotificationExecutionHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    let attributes = handlerInput.attributesManager.getSessionAttributes()
    return (ATTR_Q_CURRENT in attributes && attributes[ATTR_Q_CURRENT] !== "-1")
  },
  handle(handlerInput) {
    let context = CreateContext(handlerInput)
    context.queue.execute()
    if (!context.isDone()) {
      context.queue.askAboutNextNotification()
    }
    return context.getResponse()
  }
}

const FallbackHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return intentIs(handlerInput, FALLBACK_INTENT)
  },
  handle(handlerInput) {
    let context = CreateContext(handlerInput)
    // diabetes intentionally misspelled to help pronunciation without going phonetic
    context.speakReprompt("I didn't get that. Can you please say it again?",
                          "Can you please say that again?")
    return context.getResponse()
  }
}

const RecipeHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return intentIs(handlerInput, RECIPE_INTENT)
  },
  handle(handlerInput) {
    let context = CreateContext(handlerInput)
    // diabetes intentionally misspelled to help pronunciation without going phonetic
    let speech = `Okay. You patient health record recommends eating a low-sugar diet.
                  | I have a few recipes recommended by the american diabetes association.
                  | Would you like the recipe for Sweet and Savory Spiralized Zucchini Noodles?`.stripMargin()
    context.speakReprompt(speech, 'Want the recipe for Sweet and Savory Spiralized Zucchini Noodles?')
    context.setState(STATE_HEAR_RECIPE)
    context.setAttribute(ATTR_RECIPE, 'Sweet and Savory Spiralized Zucchini Noodles')
    return context.getResponse()
  }
}

const SpecificRecipeHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return stateIs(handlerInput, STATE_HEAR_RECIPE)
  },
  handle(handlerInput) {
    let context = CreateContext(handlerInput)
    if (intentIs(handlerInput, YES_INTENT)) {
      context.speak(`Okay. I've sent a card with the recipe and I've added the 
                    | ingredients to your Alexa shopping list.`.stripMargin())

      let cardText = `1 Zucchini
                      |1 Savory sauce
                      |
                      |Spiralize the Zucchini into noodles
                      |Add the sauce`.stripMargin()

      context.card({ title: context.getStringAttribute(ATTR_RECIPE), text: cardText })
    } else {
      context.speak("As you wish!")
    }

    context.speak(`I also saw that you have an open table reservation at Barcha this Friday. 
                   | Would you like me to call the restaurant about your dietary recommendations?`.stripMargin())
    context.reprompt("shall I call the restaurant?")
    context.setState(STATE_CALL_RESTAURANT)
    return context.getResponse()
  }
}

const CallRestaurantHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return stateIs(handlerInput, STATE_CALL_RESTAURANT)
  },
  handle(handlerInput) {
    let context = CreateContext(handlerInput)
    if (intentIs(handlerInput, YES_INTENT)) {
      context.speak("Okay. I'll call them for you.")
    } else {
      context.speak(`Okay. Don't forget to use the Blue Shield Healthy Eating app when eating out.`)
    }
    context.setState(STATE_NULL)
    context.speakReprompt("What can I help you with next?", "What next?")
    return context.getResponse()
  }
}

const HearNextNotificationHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return stateIs(handlerInput, STATE_HEAR_NEXT_NOTIFICATION)
  },
  handle(handlerInput) {
    let context = CreateContext(handlerInput)
    if (intentIs(handlerInput, YES_INTENT)) {
      context.queue.startNotification()
      if (!context.isDone()) {
        context.queue.askAboutNextNotification()
      }
    } else if (intentIs(handlerInput, NO_INTENT)) {
      context.speak("Okay.")
      context.speakReprompt(whatNext(), "What next?")
      context.setState(STATE_NULL)
    } else {
      // if user has another intent, that handler should match first
      let speech = `Hmm. I didn't get that. Please say yes or no or make another request. 
                    | Would you like to hear the next notification?`.stripMargin()
      context.speakReprompt(speech, "Do you want to hear the next notification?")
    }

    return context.getResponse()
  }
}

const HelpIntentHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return intentIs(handlerInput, 'AMAZON.HelpIntent');
  },
  handle(handlerInput) {
    const speechText = 'There is no help message for now. You\'re on your own!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
}

const CancelAndStopIntentHandler: Alexa.RequestHandler = {
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
  }
}

const SessionEndedRequestHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${(<SessionEndedRequest>handlerInput.requestEnvelope.request).reason}`);
    return handlerInput.responseBuilder.getResponse();
  }
}

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput: Alexa.HandlerInput, error: Error) {
    console.log(`Error: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, there was an error. Can you please try another question?')
      .reprompt('Please try another question')
      .getResponse();
  },
}

const configureBuilder = (): Alexa.CustomSkillBuilder => {
  const skillBuilder = Alexa.SkillBuilders.custom()
  skillBuilder
    .addRequestHandlers(
      SessionEndedRequestHandler,
      CancelAndStopIntentHandler,
      FallbackHandler,
      HelpIntentHandler,
      LaunchRequestHandler,
      PinHandler,
      NotificationExecutionHandler,
      RecipeHandler,
      SpecificRecipeHandler,
      CallRestaurantHandler,
      PlayNotificationsHandler,
      HearNextNotificationHandler
    )
    .addErrorHandlers(ErrorHandler)

  return skillBuilder
}

let skill: Alexa.Skill

exports.handler = async (event: RequestEnvelope, context: any, callback: (err: Error | null, result?: any) => void) => {
  //console.log(`EVENT: ${JSON.stringify(event, null, 2)}`)

  if (!skill) {
    skill = configureBuilder().create()
  }

  try {
    let response = await skill.invoke(event, context)
    //console.log(`RESPONSE: ${JSON.stringify(response, null, 2)}`)
    if (callback) {
      callback(null, response)
    }
    return response
  } catch (err) {
    console.log(`ERROR: ${err}`)
    if (callback) {
      callback(err, null)
      return null
    } else {
      throw err
    }
  }
}