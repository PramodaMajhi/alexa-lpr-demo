"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Alexa = __importStar(require("ask-sdk-core"));
const utils_js_1 = require("./utils.js");
const context_1 = require("./context");
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
        context.setAttribute(constants_1.ATTR_WAS_PIN_ENTERED, true);
        context.speak(`${utils_js_1.greeting()} ${constants_1.NAME}.`);
        context.queue.getNotificationNumberText(context);
        context.queue.startNotification(context);
        return context.getResponse();
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
        .addRequestHandlers(LaunchRequestHandler)
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
        }
        else {
            throw err;
        }
    }
};
