/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core')

const { stateIs, intentIs, clearState, greeting, whatNext } = require('./util.js')
const { NotificationQueue, execute } = require('./notifications')
const { addNotifications } = require('./add-notifications')
const { Context } = require('./context')
const { STATE, CONST } = require('./constants')

var queue = new NotificationQueue()
addNotifications(queue)

var context = new Context()

const RequestInterceptor = {
  process(handlerInput) {
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
    context.speak(`${greeting()} ${CONST.NAME}.`)
    queue.getNotificationNumberText(context)
    queue.getNotificationText(context)
    return context.getResponse(handlerInput)
  }
}

const PinHandler = {
  canHandle(handlerInput) {
    return stateIs(handlerInput, WAITING_FOR_PIN) && intentIs(handlerInput, "PinIntent")
  },
  handle(handlerInput) {
    let builder = handlerInput.responseBuilder

    // any 4 digit pin starting with 1 will be accepted
    if (handlerInput.requestEnvelope.request.intent.slots.pin.value[0] !== '1') {
      return builder
        .speak(`I'm sorry. That pin is not correct. What can I help you with?`)
        .reprompt("What next?")
        .getResponse()
    }

    handlerInput.attributesManager.setSessionAttributes({ state: ORDER_REFILL })
    let speechText = `Okay great, that's right. I noticed in your patient health record that you have a prescription
                      | for ${MED.name}, ready for refill on ${MED.readyDate}.
                      | It was last refilled at ${PHARMACY.name} at ${PHARMACY.address.street}, ${PHARMACY.address.city}.
                      | There are ${MED.refillsAvailable} more refills available.
                      | Would you like me to help you refill this prescription?`.stripMargin()
    return builder
      .speak(speechText)
      .reprompt(`Would you like me to order a refill for ${MED.name} at ${PHARMACY.name} at ${PHARMACY.address.street}?`)
      .getResponse()
  }
}

const OrderRefillHandler = {
  canHandle(handlerInput) {
    return stateIs(handlerInput, ORDER_REFILL)
  },
  handle(handlerInput) {
    let builder = handlerInput.responseBuilder

    if (intentIs(handlerInput, "AMAZON.YesIntent")) {
      handlerInput.attributesManager.setSessionAttributes({ state: HEAR_MORE_ABOUT_MAIL_ORDER })
      let speechText = `Okay. This prescription will be refilled at the same location. 
                        | But, since this is a routine prescription, you might want to change your prescription
                        | to a mail order pharmacy. Would you like to hear more about this?`.stripMargin()
      return builder
        .speak(speechText)
        .reprompt("Would you like to hear more about mail order prescriptions?")
        .getResponse()
    }

    return builder
      .speak("Ok. Goodbye.")
      .withShouldEndSession(true)
      .getResponse()
  }
}

const MailOrderHandler = {
  canHandle(handlerInput) {
    return stateIs(handlerInput, HEAR_MORE_ABOUT_MAIL_ORDER)
  },
  handle(handlerInput) {
    let builder = handlerInput.responseBuilder

    let speechText = ''

    if (intentIs(handlerInput, "AMAZON.YesIntent")) {
      speechText += `Please sit back and listen to a story of the wonders of mail order pharmacies. 
                     | Just kidding. I'm not programmed for that yet. `.stripMargin()
    }

    speechText += `I've placed your refill order and it should be ready for pickup on ${MED.readyDate}.
                   | I've also sent a card with the pharmacy address and prescription information.
                   | Would you like me to create a reminder for ${MED.readyDate} to pick up the prescription?`.stripMargin()

    let cardText = `Your refill prescription for ${MED.name} should be ready on ${MED.readyDate} at:
                    |${PHARMACY.name}
                    |${PHARMACY.address.street}
                    |${PHARMACY.address.city}, ${PHARMACY.address.state}, ${PHARMACY.address.zip}
                    |
                    |Phone: ${PHARMACY.phone}
                    |
                    |Your prescription number is: ${MED.prescriptionNumber}`.stripMargin()

    handlerInput.attributesManager.setSessionAttributes({ state: CREATE_PICKUP_REMINDER })

    return builder
      .speak(speechText)
      .reprompt("Would you like me to create a reminder to pick up the prescription?")
      .withSimpleCard("Prescription", cardText)
      .getResponse()
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

    handlerInput.attributesManager.setSessionAttributes({ state: CREATE_MEDICATION_REMINDER })

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

    speechText += " What can I help you with next?"

    handlerInput.attributesManager.setSessionAttributes({ state: '' })

    return builder
      .speak(speechText)
      .reprompt("What next?")
      .getResponse()
  }
}

const RecipeHandler = {
  canHandle(handlerInput) {
    return intentIs(handlerInput, "RecipeIntent")
  },
  handle(handlerInput) {
    let builder = handlerInput.responseBuilder

    // diabetes intentionally misspelled to help pronunciation without going phonetic
    let speechText = `Okay. You patient health record recommends eating a low-sugar diet.
                      | I have a few recipes recommended by the American Diabetease Association.
                      | Would you like the recipe for Sweet and Savory Spiralized Zucchini Noodles?`.stripMargin()

    handlerInput.attributesManager.setSessionAttributes({ state: HEAR_RECIPE, recipe: 'SweetAndSavorySpiralizedZucchiniNoodles' })

    return builder
      .speak(speechText)
      .reprompt('Want the recipe for Sweet and Savory Spiralized Zucchini Noodles?')
      .getResponse();
  }
}

const SpecificRecipeHandler = {
  canHandle(handlerInput) {
    return stateIs(handlerInput, HEAR_RECIPE)
  },
  handle(handlerInput) {
    let builder = handlerInput.responseBuilder

    handlerInput.attributesManager.setSessionAttributes({ state: HEAR_NOTIFICATION })

    if (intentIs(handlerInput, "AMAZON.YesIntent")) {
      let speechText = `Okay. I've sent a card with the recipe on it and I've added the ingredients to your Alexa shopping list.
                        | You have one more notification. Would you like to hear it?`.stripMargin()

      let cardText = `1 Zucchini
                      |1 Savory sauce
                      |
                      |Spiralize the Zucchini into noodles
                      |Add the sauce`.stripMargin()

      return builder
        .speak(speechText)
        .reprompt("Would you like to hear the notification?")
        .withSimpleCard("Savory Spiralized Zucchini Noodles", cardText)
        .getResponse()
    }

    let speechText = `Okay. You have one more notification. Would you like to hear it?`

    return builder
      .speak(speechText)
      .reprompt("Would you like to hear it?")
      .getResponse()
  }
}

const NotificationHandler = {
  canHandle(handlerInput) {
    return stateIs(handlerInput, HEAR_NOTIFICATION)
  },
  handle(handlerInput) {
    let builder = handlerInput.responseBuilder

    if (intentIs(handlerInput, "AMAZON.YesIntent")) {
      let speechText = `Okay. Hear is a message from Blue Shield of California.
                        | <audio src="https://s3.amazonaws.com/alexa-blue-image-files/flu.mp3"/>
                        | What next?`.stripMargin()

      clearState(handlerInput)

      return builder
        .speak(speechText)
        .reprompt("What next?")
        .getResponse()
    }
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
      .withShouldEndSession(true)
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
}

exports.handler = (event, context, callback) => {
  console.log(`REQUEST: ${JSON.stringify(event, null, 2)}`)
  const skillBuilder = Alexa.SkillBuilders.custom()
  const skill = skillBuilder
                .addRequestHandlers(
                  LaunchRequestHandler,
                  //SessionEndedRequestHandler,
                  //CancelAndStopIntentHandler,
                  //HelpIntentHandler,    
                  //PinHandler,
                  //OrderRefillHandler,
                  //MailOrderHandler,
                  //RecipeHandler,
                  //SpecificRecipeHandler,
                  //NotificationHandler,
                  //CreatePickupReminderHandler,
                  //CreateMedicationReminderHandler
                )
                .addRequestInterceptors(RequestInterceptor)
                .addResponseInterceptors(ResponseInterceptor)
                .addErrorHandlers(ErrorHandler)
                .lambda()
  skill(event, context, callback)  
}
