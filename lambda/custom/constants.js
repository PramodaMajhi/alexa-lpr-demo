const ATTR = {
  Q_HEAD: 'qHead',
  Q_CURRENT: 'qCurrent',
  STATE: 'state',
  WAS_PIN_ENTERED: 'wasPINEntered',
  RECIPE: "recipe"
}

const CONST = {
  NAME: 'Addison',
  LAUNCH_REQUEST: 'LaunchRequest',
  INTENT_REQUEST: 'IntentRequest',
  YES_INTENT: 'AMAZON.YesIntent',
  NO_INTENT: 'AMAZON.NoIntent',
  PIN_INTENT: 'PinIntent',
  RECIPE_INTENT: 'RecipeIntent',
  NOTIFICATIONS_INTENT: 'NotificationsIntent'
}

const STATE = {
  NULL: '',
  WAITING_FOR_PIN: 'WaitingForPin',
  SET_APPT_REMINDER: 'SetApptReminder?',
  ORDER_REFILL: 'OrderRefill?',
  HEAR_MORE_ABOUT_MAIL_ORDER: 'HearMoreAboutMailOrder?',
  CREATE_PICKUP_SCRIP_REMINDER: 'CreatePickupScripReminder?',
  CREATE_TAKE_SCRIPT_REMINDER: 'CreateTakeScripReminder?',
  HEAR_NEXT_NOTIFICATION: 'HearNextNotification?',
  HEAR_RECIPE: 'HearRecipe?',
}

exports.ATTR = ATTR
exports.STATE = STATE
exports.CONST = CONST