const CONST = {
  NAME: 'Addison',
  LAUNCH_REQUEST: 'LaunchRequest',
  PIN_ENTERED: "PINEntered"
}

const STATE = {
  WAITING_FOR_PIN: "WaitingForPin",
  ORDER_REFILL: "OrderRefill?",
  HEAR_MORE_ABOUT_MAIL_ORDER: "HearMoreAboutMailOrder?",
  CREATE_PICKUP_REMINDER: "CreatePickupReminder?",
  CREATE_MEDICATION_REMINDER: "CreateMedicationReminder?",
  HEAR_RECIPE: "HearRecipe?",
  HEAR_NOTIFICATION: "HearNotification?",
}

exports.STATE = STATE
exports.CONST = CONST