const ATTR = {
  Q_HEAD: 'qHead',
  Q_CURRENT: 'qCurrent',
  STATE: 'state',
  WAS_PIN_ENTERED: 'WasPINEntered',
}

const CONST = {
  NAME: 'Addison',
  LAUNCH_REQUEST: 'LaunchRequest',
  INTENT_REQUEST: 'IntentRequest',
  YES_INTENT: 'AMAZON.YesIntent',
  NO_INTENT: 'AMAZON.NoIntent',
  PIN_INTENT: 'PinIntent',
}

const STATE = {
  NULL: '',
  WAITING_FOR_PIN: 'WaitingForPin',
  SET_REMINDER: 'SetReminder?',
  ORDER_REFILL: 'OrderRefill?',
  HEAR_MORE_ABOUT_MAIL_ORDER: 'HearMoreAboutMailOrder?',
  CREATE_SCRIP_REMINDER: 'CreateScripReminder?',
  HEAR_NEXT_NOTIFICATION: 'HearNextNotification'

  //ORDER_REFILL: 'OrderRefill?',
  //HEAR_MORE_ABOUT_MAIL_ORDER: 'HearMoreAboutMailOrder?',
  //CREATE_PICKUP_REMINDER: 'CreatePickupReminder?',
  //CREATE_MEDICATION_REMINDER: 'CreateMedicationReminder?',
  //HEAR_RECIPE: 'HearRecipe?',
  //HEAR_NOTIFICATION: 'HearNotification?',
}

exports.ATTR = ATTR
exports.STATE = STATE
exports.CONST = CONST