import config from './config'
import fetch from 'node-fetch'

export const getFirstName = async () : Promise<string> => {
  try {
    let memberInfo = await getMemberInfo()
    let planMembers = memberInfo.planMembers.trim().split(' ')
    return planMembers[0]
  }
  catch(err) {
    return "Addison"
  }
}

export const getMemberInfo = async () : Promise<MemberInfo> => {
  //log.start("getMemberInfo")
  let response = await fetch(config.getMemberInfo.URL)
  //log.logValue('response', response)
  if (response.status != 200) {
    throw new Error("getMemberInfo: " + response.statusText)
  }
  let json = await response.json()
  //log.end('getMemberInfo', json)
  return json
}