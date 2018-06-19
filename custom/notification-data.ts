import moment = require('./moment-timezone')

export enum NotificationType {
  Appointment = "0",
  Refill = "1",
  Announcement = "2"
}

export interface AlexaNotification {
  type: NotificationType,
  personal: boolean,
  detail: any
}

const item1 : AlexaNotification = {
  type: NotificationType.Appointment,
  personal: true,
  detail: {
    type: 'opthamologist',
    //todo: add logic to convert dates to "today, tomorrow, etc."
    date: 'tomorrow',
    time: '4 P.M.'
  }
}

const item2 : AlexaNotification = {
  type: NotificationType.Refill,
  personal: true,
  detail: {
    med: {
      name: "Metformin",
      refillsAvailable: "2",
      // 3 days in the future from the current date in the PxT time zone, in the format like "June 18th"
      readyDate: moment().tz("America/Los_Angeles").add(3, 'days').format('MMMM Do'),
      readyTime: "3 PM",
      prescriptionNumber: "14724530"
    },
    pharmacy: {
        name: "CVS Pharmacy",
        address: {
          street: "150 Donahue Street.",
          city: "Saulsalito",
          state: "CA",
          zip: "94965",
        },
        phone: "(415) 339-0169"
    }
  }
}

const item3 : AlexaNotification = {
  type: NotificationType.Announcement,
  personal: false,
  detail: {
    message: `Okay. Here is a message from Blue Shield of California.
              | <audio src="https://s3.amazonaws.com/alexa-blue-image-files/flu.mp3"/>
              | <break time="250ms"/>`.stripMargin()
  }
}

export const notificationList : AlexaNotification[] = [item1, item2, item3]