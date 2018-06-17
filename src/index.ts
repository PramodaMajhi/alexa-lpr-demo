import * as Alexa from 'ask-sdk-core'

import { greeting } from './utils.js'
import { Context } from './context'
import { ATTR_WAS_PIN_ENTERED, NAME, LAUNCH_REQUEST } from './constants'
import { RequestEnvelope } from 'ask-sdk-model';

const CreateContext = (handlerInput: Alexa.HandlerInput) => {
  // Context holds a queue, but we can't initialize the queue from the Context
  // in the constructor of the Conext, as Construction is not complete
  let context = new Context(handlerInput)
  context.createQueue()
  return context
}

const LaunchRequestHandler : Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === LAUNCH_REQUEST
  },
  handle(handlerInput) {
    let context = CreateContext(handlerInput)

    // Alexa is having a serious problem recognizing PINS right now. I even tried it on older projects
    // that have been used for months, and the PIN intent (AMAZON.FOUR_DIGIT_NUMBER) is not recognized.
    // This is temporary
    context.setAttribute(ATTR_WAS_PIN_ENTERED, true)

    context.speak(`${greeting()} ${NAME}.`)
    context.queue.getNotificationNumberText()
    context.queue.startNotification()
    return context.getResponse()
  }
}

/*
const PlayNotificationsHandler : Alexa.RequestHandler= {
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
  canHandle(handlerInput: ) {
    return stateIs(handlerInput, STATE.WAITING_FOR_PIN) && intentIs(handlerInput, CONST.PIN_INTENT)
  },
  handle(handlerInput: ) {
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
*/
// this handler should be last
const NotificationExecutionHandler : Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return true
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
/*
const RecipeHandler = {
  canHandle(handlerInput: ) {
    return intentIs(handlerInput, CONST.RECIPE_INTENT)
  },
  handle(handlerInput: ) {
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
  canHandle(handlerInput: ) {
    return stateIs(handlerInput, STATE.HEAR_RECIPE)
  },
  handle(handlerInput: ) {
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
*/
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

const configureBuilder = () : Alexa.CustomSkillBuilder => {
  const skillBuilder = Alexa.SkillBuilders.custom()
  skillBuilder
    .addRequestHandlers(
      //SessionEndedRequestHandler,
      //CancelAndStopIntentHandler,
      //HelpIntentHandler,
      LaunchRequestHandler,
      //PinHandler,
      //RecipeHandler,
      //SpecificRecipeHandler,
      //PlayNotificationsHandler,
      //HearNextNotificationHandler,
      NotificationExecutionHandler,
    )
    .addErrorHandlers(ErrorHandler)

  return skillBuilder
}

let skill : Alexa.Skill

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
    } else {
      throw err
    }
  }
}