//const {stateIs, intentIs, clearState, greeting} = require('../custom/util.js')
//const {NotificationQueue} = require('../custom/notification-queue.js')
//const {addNotifications} = require('../custom/add-notifications')
const {handler} = require('../custom/index')

let r = null

const callback = (err, resp) => {
  if (err) {
    console.log(`Error: ${JSON.stringify(err, null, 2)}`)
  } else {
    console.log(`Response: ${JSON.stringify(resp, null, 2)}`)
    r = resp
  }
}

const event = {
  session: {
    new: true,
    sessionId: "amzn1.echo-api.session.[unique-value-here]",
    attributes: {},
    user: {
      userId: "amzn1.ask.account.[unique-value-here]"
    },
    application: {
      applicationId: "amzn1.ask.skill.[unique-value-here]"
    }
  },
  version: "1.0",
  request: {
    locale: "en-US",
    timestamp: "2016-10-27T18:21:44Z",
    type: "LaunchRequest",
    requestId: "amzn1.echo-api.request.[unique-value-here]",
    intent: {
      name: "AMAZON.YesIntent",
      confirmationStatus: "NONE",
      slots: {
          pin: {
              name: "pin",
              value: "1000",
              confirmationStatus: "NONE"
          }
      }
    }
  },
  context: {
    AudioPlayer: {
      playerActivity: "IDLE"
    },
    System: {
      device: {
        supportedInterfaces: {
          AudioPlayer: {}
        }
      },
      application: {
        applicationId: "amzn1.ask.skill.[unique-value-here]"
      },
      user: {
        userId: "amzn1.ask.account.[unique-value-here]"
      }
    }
  }
}

handler(event, {}, callback)
/*
event.session.new = false
event.session.attributes = response.sessionAttributes
event.request.type = "IntentRequest"
event.request.intent.name = 'PinIntent'

handler(event, {}, callback)
*/