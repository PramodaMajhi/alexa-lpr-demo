import { NotificationType, AlexaNotification } from './notification-data'
import {
  STATE_NULL, STATE_SET_APPT_REMINDER, YES_INTENT, NO_INTENT, STATE_ORDER_REFILL,
  STATE_HEAR_MORE_ABOUT_MAIL_ORDER, STATE_CREATE_PICKUP_SCRIP_REMINDER, STATE_CREATE_TAKE_SCRIPT_REMINDER
} from "./constants"

export type When = {
  state?: string,
  intent?: string
}

export type Then = {
  speak?: string,
  reprompt?: string,
  card?: {
    title: string,
    text: string
  }
  setState?: string,
  jump?: string
}

export type Rule = {
  ruleId?: string,
  when: When,
  then: Then
}

const appointmentRules = (notification: AlexaNotification): Rule[] => {
  const { type, date, time } = notification.detail
  const list: Rule[] = [
    {
      when: { state: STATE_NULL },
      then: {
        speak: `You have an ${type} appointment ${date} at ${time}. Would you like me to set a reminder?`,
        reprompt: 'Shall I set a reminder?',
        setState: STATE_SET_APPT_REMINDER
      }
    },
    {
      when: {
        state: STATE_SET_APPT_REMINDER,
        intent: YES_INTENT
      },
      then: {
        speak: "Okay. I've created a reminder."
      }
    },
    {
      when: {
        state: STATE_SET_APPT_REMINDER,
        intent: NO_INTENT
      },
      then: {
        speak: 'Okay.'
      }
    }
  ]

  return list
}


const refillRules = (notification: AlexaNotification): Rule[] => {
  const { med, pharmacy } = notification.detail
  const list: Rule[] = [
    {
      when: { state: STATE_NULL },
      then: {
        speak: `I noticed in your patient health record that you have a prescription
                | for ${med.name}, ready for refill on ${med.readyDate}.
                | It was last refilled at ${pharmacy.name} at ${pharmacy.address.street}, ${pharmacy.address.city}.
                | There are ${med.refillsAvailable} more refills available.
                | Would you like me to help you refill this prescription?`.stripMargin(),
        reprompt: `Would you like me to order a refill for ${med.name} at ${pharmacy.name} at ${pharmacy.address.street}?`,
        setState: STATE_ORDER_REFILL
      }
    },
    {
      when: {
        state: STATE_ORDER_REFILL,
        intent: YES_INTENT
      },
      then: {
        speak: `Okay. This prescription will be refilled at the same location. 
              | But, since this is a routine prescription, you might want to change your prescription
              | to a mail order pharmacy which could help you save money. Would you like to hear more about this?`.stripMargin(),
        reprompt: 'Would you like to hear more about mail order prescriptions?',
        setState: STATE_HEAR_MORE_ABOUT_MAIL_ORDER
      }
    },
    {
      when: {
        state: STATE_ORDER_REFILL,
        intent: NO_INTENT
      },
      then: {
        speak: 'As you wish.'
      }
    },
    {
      when: {
        state: STATE_HEAR_MORE_ABOUT_MAIL_ORDER,
        intent: YES_INTENT
      },
      then: {
        speak: 'Mail order pharmacies are great.',
        jump: '3ae27b6d'
      },
    },
    {
      when: {
        state: STATE_HEAR_MORE_ABOUT_MAIL_ORDER,
        intent: NO_INTENT
      },
      then: {
        speak: 'Okay.',
        jump: '3ae27b6d'
      }
    },
    {
      ruleId: '3ae27b6d',
      when: {
        // when the when is empty, the rule can never be matched, only jumped to
      },
      then: {
        speak: `I've completed your refill request and it will be ready for pickup on ${med.readyDate} at ${med.readyTime}.
                | I've also sent a card to your Alexa app with the address, the prescription and the prescription number.
                | Would you like me to set a reminder to pick up your prescription?`.stripMargin(),
        reprompt: 'Would you like me to create a reminder to pick up your prescription?',
        card: {
          title: 'Prescription',
          text: `Your refill prescription for ${med.name} should be ready on ${med.readyDate} at ${med.readyTime} at:
              |${pharmacy.name}
              |${pharmacy.address.street}
              |${pharmacy.address.city}, ${pharmacy.address.state}, ${pharmacy.address.zip}
              |
              |Phone: ${pharmacy.phone}
              |
              |Your prescription number is: ${med.prescriptionNumber}`.stripMargin()
        },
        setState: STATE_CREATE_PICKUP_SCRIP_REMINDER
      }
    },
    {
      when: {
        state: STATE_CREATE_PICKUP_SCRIP_REMINDER,
        intent: YES_INTENT
      },
      then: {
        speak: `Done. Your reminder is set for ${med.readyDate} at ${med.readyTime}.`,
        jump: 'd0386017'
      }
    },
    {
      when: {
        state: STATE_CREATE_PICKUP_SCRIP_REMINDER,
        intent: NO_INTENT
      },
      then: {
        speak: 'Okay.',
        jump: 'd0386017'
      }
    },
    {
      ruleId: 'd0386017',
      when: {},
      then: {
        speak: `I also see that you are supposed to take this medicine 2 times per day. 
               | Would you like me to remind you each morning and evening?`.stripMargin(),
        reprompt: 'Shall I set a reminder to take your medicine?',
        setState: STATE_CREATE_TAKE_SCRIPT_REMINDER
      }
    },
    {
      when: {
        state: STATE_CREATE_TAKE_SCRIPT_REMINDER,
        intent: YES_INTENT
      },
      then: {
        speak: `I've created a reminder each morning and evening to take your medicine.`
      }
    },
    {
      when: {
        state: STATE_CREATE_TAKE_SCRIPT_REMINDER,
        intent: NO_INTENT
      },
      then: {
        speak: 'As you wish!'
      }
    }
  ]
  return list
}

const announcementRules = (notification: AlexaNotification): Rule[] => {
  const { message } = notification.detail
  const list: Rule[] = [
    {
      when: {
        state: STATE_NULL
      },
      then: {
        speak: message
      }
    }
  ]
  return list
}

const lookup: { [key in NotificationType]?: (notification: AlexaNotification) => Rule[] } = {
  [NotificationType.Appointment]: appointmentRules,
  [NotificationType.Refill]: refillRules,
  [NotificationType.Announcement]: announcementRules
}

export const getRules = (notification: AlexaNotification): Rule[] => {
  let fn = lookup[notification.type]
  return fn ? fn(notification) : []
}