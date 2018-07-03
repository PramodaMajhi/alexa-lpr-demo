"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
String.prototype.stripMargin = function () {
    return this.replace(/^.*\|/gm, '');
};
const Alexa = require("ask-sdk-core");
const context_1 = require("./context");
const utils_js_1 = require("./utils.js");
const constants_1 = require("./constants");
const CreateContext = (handlerInput) => {
    let context = new context_1.Context(handlerInput);
    context.createQueue();
    return context;
};
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === constants_1.LAUNCH_REQUEST;
    },
    handle(handlerInput) {
        let context = CreateContext(handlerInput);
        context.speak(utils_js_1.greeting());
        context.queue.getNotificationNumberText();
        context.queue.startNotification();
        return context.getResponse();
    }
};
const PlayNotificationsHandler = {
    canHandle(handlerInput) {
        return utils_js_1.intentIs(handlerInput, constants_1.NOTIFICATIONS_INTENT);
    },
    handle(handlerInput) {
        let context = CreateContext(handlerInput);
        context.queue.getNotificationNumberText();
        context.queue.startNotification();
        if (!context.isDone()) {
            context.queue.askAboutNextNotification();
        }
        return context.getResponse();
    }
};
const PinHandler = {
    canHandle(handlerInput) {
        return utils_js_1.intentIs(handlerInput, constants_1.PIN_INTENT);
    },
    handle(handlerInput) {
        let context = CreateContext(handlerInput);
        let intent = handlerInput.requestEnvelope.request.intent;
        if (intent && intent.slots && intent.slots.pin.value[0] !== '1') {
            context.speakReprompt("I'm sorry. That pin is not correct. Please say the PIN again.", "Please say the PIN again");
            return context.getResponse();
        }
        context.speak(`Okay, great. That's right.`);
        context.setAttribute(constants_1.ATTR_WAS_PIN_ENTERED, true);
        context.queue.startNotification();
        if (!context.isDone()) {
            context.queue.askAboutNextNotification();
        }
        return context.getResponse();
    }
};
const NotificationExecutionHandler = {
    canHandle(handlerInput) {
        let attributes = handlerInput.attributesManager.getSessionAttributes();
        return (constants_1.ATTR_Q_CURRENT in attributes && attributes[constants_1.ATTR_Q_CURRENT] !== "-1");
    },
    handle(handlerInput) {
        let context = CreateContext(handlerInput);
        context.queue.execute();
        if (!context.isDone()) {
            context.queue.askAboutNextNotification();
        }
        return context.getResponse();
    }
};
const FallbackHandler = {
    canHandle(handlerInput) {
        return utils_js_1.intentIs(handlerInput, constants_1.FALLBACK_INTENT);
    },
    handle(handlerInput) {
        let context = CreateContext(handlerInput);
        context.speakReprompt("I didn't get that. Can you please say it again?", "Can you please say that again?");
        return context.getResponse();
    }
};
const RecipeHandler = {
    canHandle(handlerInput) {
        return utils_js_1.intentIs(handlerInput, constants_1.RECIPE_INTENT);
    },
    handle(handlerInput) {
        let context = CreateContext(handlerInput);
        let speech = `Okay. You patient health record recommends eating a low-sugar diet.
                  | I have a few recipes recommended by the american diabetes association.
                  | Would you like the recipe for Sweet and Savory Spiralized Zucchini Noodles?`.stripMargin();
        context.speakReprompt(speech, 'Want the recipe for Sweet and Savory Spiralized Zucchini Noodles?');
        context.setState(constants_1.STATE_HEAR_RECIPE);
        context.setAttribute(constants_1.ATTR_RECIPE, 'Sweet and Savory Spiralized Zucchini Noodles');
        return context.getResponse();
    }
};
const SpecificRecipeHandler = {
    canHandle(handlerInput) {
        return utils_js_1.stateIs(handlerInput, constants_1.STATE_HEAR_RECIPE);
    },
    handle(handlerInput) {
        let context = CreateContext(handlerInput);
        if (utils_js_1.intentIs(handlerInput, constants_1.YES_INTENT)) {
            context.speak(`Okay. I've sent a card with the recipe and I've added the 
                    | ingredients to your Alexa shopping list.`.stripMargin());
            let cardText = `1 Zucchini
                      |1 Savory sauce
                      |
                      |Spiralize the Zucchini into noodles
                      |Add the sauce`.stripMargin();
            context.card({ title: context.getStringAttribute(constants_1.ATTR_RECIPE), text: cardText });
        }
        else {
            context.speak("As you wish!");
        }
        context.speak(`I also saw that you have an open table reservation at Barcha this Friday. 
                   | Would you like me to call the restaurant about your dietary recommendations?`.stripMargin());
        context.reprompt("shall I call the restaurant?");
        context.setState(constants_1.STATE_CALL_RESTAURANT);
        return context.getResponse();
    }
};
const CallRestaurantHandler = {
    canHandle(handlerInput) {
        return utils_js_1.stateIs(handlerInput, constants_1.STATE_CALL_RESTAURANT);
    },
    handle(handlerInput) {
        let context = CreateContext(handlerInput);
        if (utils_js_1.intentIs(handlerInput, constants_1.YES_INTENT)) {
            context.speak("Okay. I'll call them for you.");
        }
        else {
            context.speak(`Okay. Don't forget to use the Blue Shield Healthy Eating app when eating out.`);
        }
        context.setState(constants_1.STATE_NULL);
        context.speakReprompt("What can I help you with next?", "What next?");
        return context.getResponse();
    }
};
const HearNextNotificationHandler = {
    canHandle(handlerInput) {
        return utils_js_1.stateIs(handlerInput, constants_1.STATE_HEAR_NEXT_NOTIFICATION);
    },
    handle(handlerInput) {
        let context = CreateContext(handlerInput);
        if (utils_js_1.intentIs(handlerInput, constants_1.YES_INTENT)) {
            context.queue.startNotification();
            if (!context.isDone()) {
                context.queue.askAboutNextNotification();
            }
        }
        else if (utils_js_1.intentIs(handlerInput, constants_1.NO_INTENT)) {
            context.speak("Okay.");
            context.speakReprompt(utils_js_1.whatNext(), "What next?");
            context.setState(constants_1.STATE_NULL);
        }
        else {
            let speech = `Hmm. I didn't get that. Please say yes or no or make another request. 
                    | Would you like to hear the next notification?`.stripMargin();
            context.speakReprompt(speech, "Do you want to hear the next notification?");
        }
        return context.getResponse();
    }
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return utils_js_1.intentIs(handlerInput, 'AMAZON.HelpIntent');
    },
    handle(handlerInput) {
        const speechText = 'There is no help message for now. You\'re on your own!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
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
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    }
};
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error: ${error.message}`);
        return handlerInput.responseBuilder
            .speak('Sorry, there was an error. Can you please try another question?')
            .reprompt('Please try another question')
            .getResponse();
    },
};
const configureBuilder = () => {
    const skillBuilder = Alexa.SkillBuilders.custom();
    skillBuilder
        .addRequestHandlers(SessionEndedRequestHandler, CancelAndStopIntentHandler, FallbackHandler, HelpIntentHandler, LaunchRequestHandler, PinHandler, NotificationExecutionHandler, RecipeHandler, SpecificRecipeHandler, CallRestaurantHandler, PlayNotificationsHandler, HearNextNotificationHandler)
        .addErrorHandlers(ErrorHandler);
    return skillBuilder;
};
let skill;
exports.handler = async (event, context, callback) => {
    if (!skill) {
        skill = configureBuilder().create();
    }
    try {
        let response = await skill.invoke(event, context);
        if (callback) {
            callback(null, response);
        }
        return response;
    }
    catch (err) {
        console.log(`ERROR: ${err}`);
        if (callback) {
            callback(err, null);
            return null;
        }
        else {
            throw err;
        }
    }
};
//# sourceMappingURL=index.js.map