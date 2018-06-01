/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core')

const HEAR_IMPORTANT_MESSAGE = "HearImportantMessage?"
const ORDER_REFILL = "OrderRefill?"
const CREATE_PICKUP_REMINDER = "CreatePickupReminder?"
const CREATE_MEDICATION_REMINDER = "CreateMedicationReminder?"

const stateIs = (handlerInput, state) => {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes()
  const sessionState = sessionAttributes.state
  const result = sessionState === state
  //console.log(`stateIs: session state is ${sessionState}. Looking for ${state}. returning: ${result}`)
  return result
}

const intentIs = (handlerInput, intent) => {
  const result = handlerInput.requestEnvelope.request.type === 'IntentRequest'
                 && handlerInput.requestEnvelope.request.intent.name === intent
  //console.log(`intentIs: ${intent} is returning: ${result}`)
  return result
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    console.log(`request: ${JSON.stringify(handlerInput, null, 2)}`)
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
  },
  handle(handlerInput) {
    const speechText = "Good morning Addison. I have an important message for you. Would you like to hear it?"

    handlerInput.attributesManager.setSessionAttributes({state: HEAR_IMPORTANT_MESSAGE})

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse()
  },
}

const ImportantMessageHandler = {
  canHandle(handlerInput) {    
    return stateIs(handlerInput, HEAR_IMPORTANT_MESSAGE)
  },
  handle(handlerInput) {
    let builder = handlerInput.responseBuilder

    if (intentIs(handlerInput, "AMAZON.YesIntent")) {
      builder.speak("I noticed you have a prescription for drug name ready for refill on June 6th." +
                    " It was refilled last time at CVS Pharmacy at 150 Donahue Street, Sausalito." +
                    " There are 2 more refills available." +
                    " Would you like me to order a refill for you at the same location?")
      handlerInput.attributesManager.setSessionAttributes({state: ORDER_REFILL})
    } else {
      builder
        .speak("Ok. Goodbye.")
        .withShouldEndSession(true)
    }

    return builder.getResponse()
  }
}

const OrderRefillHandler = {
  canHandle(handlerInput) {
    return stateIs(handlerInput, ORDER_REFILL)
  },
  handle(handlerInput) {
    let builder = handlerInput.responseBuilder

    if (intentIs(handlerInput, "AMAZON.YesIntent")) {
      builder.speak("I've placed your refill order and it should be ready for pickup on June 6th." +
                    " I've also sent a card with the pharmacy address and prescription information." +
                    " Would you like me to create a reminder for June 6th to pick up the prescription?")
              .withSimpleCard("Prescription",
                  "Your prescription for some medicine should be ready on June 6th at:\n" +
                  "CVS Pharmacy\n" +
                  "150 Donahue St.\n" +
                  "Saulsalito, CA, 94965\n\n" +
                  "Phone: (415) 339-0169\n\n" +
                  "Your prescription number is: 14724530"
                )
      
    } else {
      builder
        .speak("Ok. I can't order at other locations yet. Goodbye.")
        .withShouldEndSession(true)
    }

    handlerInput.attributesManager.setSessionAttributes({state: CREATE_PICKUP_REMINDER})

    return builder.getResponse();
  }
}

const CreatePickupReminderHandler = {
  canHandle(handlerInput) {
    return stateIs(handlerInput, CREATE_PICKUP_REMINDER)
  },
  handle(handlerInput) {
    let builder = handlerInput.responseBuilder

    let speechText

    if (intentIs(handlerInput, "AMAZON.YesIntent")) {
      speechText = "OK, I've created a reminder to pick up the prescription."
    } else {
      speechText = "Ok."
    }

    speechText += "I see you should take this medicine twice per day. Would you like me to create reminders for you each morning and evening?"

    handlerInput.attributesManager.setSessionAttributes({state: CREATE_MEDICATION_REMINDER})

    return builder
      .speak(speechText)
      .getResponse();
  }
}

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return intentIs(handlerInput, 'AMAZON.HelpIntent');
  },
  handle(handlerInput) {
    const speechText = 'You can say hello to me!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

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
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    ImportantMessageHandler,
    OrderRefillHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
