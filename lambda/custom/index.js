/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core')

const MED = {
  name: "Metformin",
  refillsAvailable: "2",
  readyDate: "June 6th",
  prescriptionNumber: "14724530"
}

const PHARMACY = {
  name: "CVS Pharmacy",
  address: {
    street: "150 Donahue Street.",
    city: "Saulsalito",
    state: "CA",
    zip: "94965",
  },
  phone: "(415) 339-0169"
}

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

// for every line of a multi-line string, remove the characters fom the beginning of the line to the pipe character
String.prototype.stripMargin = function () {
  return this.replace(/^.*\|/gm, '')
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    console.log(`request: ${JSON.stringify(handlerInput, null, 2)}`)
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
  },
  handle(handlerInput) {

    handlerInput.attributesManager.setSessionAttributes({state: HEAR_IMPORTANT_MESSAGE})

    return handlerInput.responseBuilder
      .speak("Good morning Addison. I have an important message for you. Would you like to hear it?")
      .reprompt("Would you like to hear the important message?")
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
      handlerInput.attributesManager.setSessionAttributes({state: ORDER_REFILL})

      let speechText = `I noticed you have a prescription for ${MED.name} ready for refill on ${MED.readyDate}.
                        |It was refilled last time at ${PHARMACY.name} at ${PHARMACY.address.street}, ${PHARMACY.address.city}.
                        |There are ${MED.refillsAvailable} more refills available.
                        |Would you like me to order a refill for you at the same location?`.stripMargin()
      builder.speak(speechText)
             .reprompt(`Would you like me to order a refill for ${MED.name} at ${PHARMACY.name} at ${PHARMACY.address.street}?`)
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

    let speechText = `I've placed your refill order and it should be ready for pickup on ${MED.readyDate}.
                      |I've also sent a card with the pharmacy address and prescription information.
                      |Would you like me to create a reminder for ${MED.readyDate} to pick up the prescription?`.stripMargin()

    let cardText = `Your refill prescription for ${MED.name} should be ready on ${MED.readyDate} at:
                    |${PHARMACY.name}
                    |${PHARMACY.address.street}
                    |${PHARMACY.address.city}, ${PHARMACY.address.state}, ${PHARMACY.address.zip}
                    |
                    |Phone: ${PHARMACY.phone}
                    |
                    |Your prescription number is: ${MED.prescriptionNumber}`.stripMargin()

    if (intentIs(handlerInput, "AMAZON.YesIntent")) {
      builder.speak(speechText)
              .reprompt("Would you like me to create a reminder to pick up the prescription?")
              .withSimpleCard("Prescription", cardText)      
    } else {
      builder
        .speak("Ok. I'm sorry, but I can't order at other locations yet. Goodbye.")
        .withShouldEndSession(true)
    }

    handlerInput.attributesManager.setSessionAttributes({state: CREATE_PICKUP_REMINDER})

    return builder.getResponse()
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

    speechText += " I see you should take this medicine twice per day. Would you like me to create reminders for you each morning and evening?"

    handlerInput.attributesManager.setSessionAttributes({state: CREATE_MEDICATION_REMINDER})

    return builder
      .speak(speechText)
      .reprompt("Would you like me to create medication reminders for you?")
      .getResponse();
  }
}

const CreateMedicationReminderHandler = {
  canHandle(handlerInput) {
    return stateIs(handlerInput, CREATE_MEDICATION_REMINDER)
  },
  handle(handlerInput) {
    let builder = handlerInput.responseBuilder

    let speechText

    if (intentIs(handlerInput, "AMAZON.YesIntent")) {
      speechText = "OK, I've created a medication reminder for you."
    } else {
      speechText = "Ok."
    }

    speechText += " Thank you for using Blue Shield of California. Goodbye."
    
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
    const speechText = 'There is no help message for now. You\'re on your own!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
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
      .speak('Sorry, I can\'t understand the command. Will you please say it again?')
      .reprompt('Sorry, I can\'t understand the command. Will you please say it again?')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    SessionEndedRequestHandler,
    CancelAndStopIntentHandler,
    HelpIntentHandler,  
    LaunchRequestHandler,
    ImportantMessageHandler,
    OrderRefillHandler,
    CreatePickupReminderHandler,
    CreateMedicationReminderHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
