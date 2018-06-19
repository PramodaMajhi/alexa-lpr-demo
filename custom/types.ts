interface String {
    stripMargin() : string
}

interface MemberInfo {
  address: string,
  location: string,    // lat,lng
  phone: string,
  email: string,
  planMembers: string,  // list of names separate by comma
  hsa: number,  
  id: string,
  grp: string,
  deductable: number,
  remainingDeductable: number,
  pin: string
}

