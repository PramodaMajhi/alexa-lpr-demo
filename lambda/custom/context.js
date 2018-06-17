"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notification_queue_1 = require("./notification-queue");
const constants_1 = require("./constants");
class Context {
    constructor(handlerInput) {
        this._handlerInput = handlerInput;
        this._attributes = handlerInput.attributesManager.getSessionAttributes();
        this._notificationQueue = null;
        this._speak = '';
        this._reprompt = '';
        this._card = null,
            this._shouldEndSession = false;
    }
    createQueue() {
        this._notificationQueue = new notification_queue_1.NotificationQueue(this);
    }
    get queue() {
        if (this._notificationQueue === null) {
            throw new Error("NotificationQueue is null");
        }
        return this._notificationQueue;
    }
    get handlerInput() {
        return this._handlerInput;
    }
    speak(text) {
        this._speak += text + ' ';
    }
    reprompt(text) {
        this._reprompt = text;
    }
    card(card) {
        this._card = card;
    }
    speakReprompt(text, reprompt) {
        this.speak(text);
        this.reprompt(reprompt);
    }
    setAttributes(attr) {
        this._attributes = attr;
    }
    getAttributes() {
        return this._attributes;
    }
    setAttribute(key, value) {
        this._attributes[key] = value.toString();
    }
    getStringAttribute(key) {
        return this._attributes[key];
    }
    getNumericAttribute(key, def) {
        if (key in this._attributes) {
            return parseInt(this._attributes[key], 10);
        }
        return def;
    }
    getBooleanAttribute(key, def) {
        if (key in this._attributes) {
            return this._attributes[key] === 'true';
        }
        return def;
    }
    setState(state) {
        this.setAttribute(constants_1.ATTR_STATE, state);
    }
    getState() {
        return this.getStringAttribute(constants_1.ATTR_STATE);
    }
    isDone() {
        return this._reprompt !== '';
    }
    getResponse() {
        this._handlerInput.attributesManager.setSessionAttributes(this.getAttributes());
        let builder = this._handlerInput.responseBuilder;
        if (this._speak) {
            builder.speak(this._speak);
        }
        if (this._reprompt) {
            builder.reprompt(this._reprompt);
        }
        if (this._card) {
            builder.withSimpleCard(this._card.title, this._card.text);
        }
        if (this._shouldEndSession) {
            builder.withShouldEndSession(true);
        }
        return builder.getResponse();
    }
}
exports.Context = Context;
