export default class UserCache {
    constructor(uuid,attributes,connetionResponse) {
        this.uuid = uuid; // the users session uuid
        this.attributes = attributes //the users attributes as those were used when authenticating at the various data sources
        this.connetionResponse= connetionResponse // the did etc. after accepting the connection response
      }
}