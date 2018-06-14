const moment = require('./moment-timezone')

let item1 = {
  type: "appointment",
  personal: true,
  detail: {
    type: 'opthamologist',
    //todo: add logic to convert dates to "today, tomorrow, etc."
    date: 'tomorrow',
    time: '11:30 AM'
  }
}

let item2 = {
  type: "refill",
  personal: true,
  detail: {
    med: {
      name: "Metformin",
      refillsAvailable: "2",
      readyDate: "June 13th",
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

item2.detail.med.readyDate = moment().tz("America/Los_Angeles").add(3, 'days').format('MMMM Do')

let item3 = {
  type: "announcement",
  personal: false,
  detail: {
    message: `Okay. Hear is a message from Blue Shield of California.
              | <audio src="https://s3.amazonaws.com/alexa-blue-image-files/flu.mp3"/>`.stripMargin()
  }
}

const addNotifications = (queue) => {  
  queue.add(item1)  
  queue.add(item2)  
  queue.add(item3)
}

module.exports.addNotifications = addNotifications