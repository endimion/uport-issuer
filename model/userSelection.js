export default class UserSelection {
    constructor(key,source) {
      this.source = source; // denotes the source, i.e. eIDAS, edugain etc
      this.key = key //denotes attribute name e.g. personIdentifier
    }
  }