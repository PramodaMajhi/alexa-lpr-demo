const CONST = {
  NAME: 'Addison',
  LAUNCH_REQUEST: 'LaunchRequest',
  PIN_ENTERED: 'PINEntered',
  YES_INTENT: 'AMAZON.YesIntent',
  NO_INTENT: 'AMAZON.NoIntent'
}

const STATE = {
  NULL: '',
  WAITING_FOR_PIN: 'WaitingForPin',
  SET_REMINDER: 'SetReminder?',
  ORDER_REFILL: 'OrderRefill?',
  HEAR_MORE_ABOUT_MAIL_ORDER: 'HearMoreAboutMailOrder?',
  CREATE_SCRIP_REMINDER: 'CreateScripReminder?'

  //ORDER_REFILL: 'OrderRefill?',
  //HEAR_MORE_ABOUT_MAIL_ORDER: 'HearMoreAboutMailOrder?',
  //CREATE_PICKUP_REMINDER: 'CreatePickupReminder?',
  //CREATE_MEDICATION_REMINDER: 'CreateMedicationReminder?',
  //HEAR_RECIPE: 'HearRecipe?',
  //HEAR_NOTIFICATION: 'HearNotification?',
}

exports.STATE = STATE
exports.CONST = CONST