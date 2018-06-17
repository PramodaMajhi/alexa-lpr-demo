const {handler} = require('../custom/index')

let response

const callback = (err, resp) => {
  if (err) {
    console.log(`Error: ${JSON.stringify(err, null, 2)}`)
  } else {
    console.log(`Response: ${JSON.stringify(resp, null, 2)}`)
  }
}

let event = {
  session: {
    new: true,
    sessionId: "amzn1.echo-api.session.[unique-value-here]",
    attributes: {
    },
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

const call = async (intent) => {
  if (intent) {
    event.session.attributes = response.sessionAttributes
    event.request.type = 'IntentRequest'
    event.request.intent.name = intent
  }
  response = await handler(event, {})
  console.log(response.response.outputSpeech.ssml)
}

const yes = async () => {
  console.log('--YES--')
  await call('AMAZON.YesIntent')
}

const no = async () => {
  console.log('--NO--')
  await call('AMAZON.NoIntent')
}

const test = async () => {
  // Launch
  await call()
  
  // Good morning Addison. You have 3 notifications. Please say your Blue Shield 4-digit pin if you would like to hear them now.

  event.session.new = false
  // note: pin slot is already in event
  //console.log("--PIN--")
  //await call('PinIntent')  

  // You have an opthamologist appointment tomorrow at 11:30 AM. Would you like me to set a reminder?

  await yes()

  // OK, I've created a reminder. Your next notification is about a medication refill. Would you like to hear it now?

  await yes()

  // I noticed in your patient health record that you have a prescription
  // for Metformin, ready for refill on June 13th.
  // It was last refilled at CVS Pharmacy at 150 Donahue Street., Saulsalito.
  // There are 2 more refills available.
  // Would you like me to help you refill this prescription?

  await yes()

  // Okay. This prescription will be refilled at the same location. 
  // But, since this is a routine prescription, you might want to change your prescription
  // to a mail order pharmacy. Would you like to hear more about this?

  await yes()

  // Okay. I've placed your refill order and it should be ready for pickup on June 13th.
  // I've also sent a card with the pharmacy address and prescription information.
  // Would you like me to create a reminder for June 13th to pick up the prescription?

  await yes()

  // Okay, great. Your reminder is set for June 17th at 3 PM. I also see you should take this medicine 2 times per day. 
  // Would you like me to remind you each morning and evening?

  await no()

  // Okay, I've created a reminder each morning and evening to take your medicine. 
  // Your next notification is an announcement. Would you like to hear it now?
  
  console.log("--RecipeIntent--")
  await call('RecipeIntent')

  // Okay. You patient health record recommends eating a low-sugar diet.
  // I have a few recipes recommended by the American Diabetease Association.
  // Would you like the recipe for Sweet and Savory Spiralized Zucchini Noodles?

  await yes()

  // Okay. I've sent a card with the recipe on it and I've added the ingredients to your Alexa shopping list. 
  // Your next notification is an announcement. Would you like to hear it now?

  await yes()
  
  // Here is a message from Blue Shield of California. <audio src="https://s3.amazonaws.com/alexa-blue-image-files/flu.mp3"/> 
  // <break time="100ms"/>There are no more notifications. What can I help you with next?</speak
  //console.log(JSON.stringify(response, null, 2))

  console.log("--STOP--")
  await call('AMAZON.StopIntent')
}

test()