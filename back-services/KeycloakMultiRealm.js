const Keycloak = require("keycloak-connect");
const compose = require("compose-middleware").compose;

// var Keycloak = require("keycloak-connect");
// var keycloak = new Keycloak({
//   store: memoryStore
// });

function KeycloakMultiRealm(config, keycloakConfigs) {
  this.keycloakPerRealm = {};
  this.getRealmName = req => {
    //if we are behind a reverse proxy then the realm will be the third  index of the array
    // else it will be the second

    let url = req.originalUrl; 

    // for example, you could get the realmName from the path
    // console.log(`the url is ${req.originalUrl}`);
    if (process.env.BASE_PATH) {
      url = url.replace(`/${process.env.BASE_PATH}/`,'')
    }

    return url.split("/")[1];
  };
  keycloakConfigs.forEach(kConfig => {
    this.keycloakPerRealm[kConfig.realm] = new Keycloak(config, kConfig);
  });
  // console.log(`keycloaks::`);
  // console.log(this.keycloakPerRealm);
}

KeycloakMultiRealm.prototype.middleware = function(options) {
  return (req, res, next) => {
    const realmName = this.getRealmName(req);
    // console.log(`the keycloakRealm is ${realmName}`);

    if (realmName === "test" || realmName === "esmo" || realmName === "eidas") {
      console.log(`keylcoakMultiRealm.js:: ${realmName}`);
      const keycloak = this.keycloakPerRealm[realmName];
      const middleware = compose(keycloak.middleware());
      // console.log(`***********keycloakMultiRealm******`)
      // console.log(keycloak)
      // console.log(`*****************`)
      middleware(req, res, next);
    } else {
      //if no realm exists in the path, just continue the request
      const middleware = compose();
      middleware(req, res, next);
    }
  };
};

KeycloakMultiRealm.prototype.protect = function(spec) {
  return (req, res, next) => {
    const realmName = this.getRealmName(req);
    const keycloak = this.keycloakPerRealm[realmName];
    keycloak.protect(spec)(req, res, next);
  };
};

KeycloakMultiRealm.prototype.getKeycloakForRealm = function(req) {
  const realmName = this.getRealmName(req);
  const keycloak = this.keycloakPerRealm[realmName];
  return keycloak;
};

module.exports = KeycloakMultiRealm;
