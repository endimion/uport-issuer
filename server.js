const express = require("express");
const next = require("next");
const ngrok = require("ngrok");

const port = parseInt(process.env.PORT, 10) || 5000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const bodyParser = require("body-parser");
const session = require("express-session");
const MemcachedStore = require("connect-memcached")(session);

const axios = require("axios");

import { subscribe } from "./back-services/server-sent-events";
const makeConnectionRequest = require("./back-controllers/controllers")
  .makeConnectionRequest;
const cacheUserConnectionRequest = require("./back-controllers/controllers")
  .cacheUserConnectionRequest;
const credentialsIssuanceConnectionResponse = require("./back-controllers/controllers")
  .credentialsIssuanceConnectionResponse;
const issueVc = require("./back-controllers/controllers").issueVC;

// const proxy = require("http-proxy-middleware");
// const proxyOptions = {
//   target: `http://localhost:${port}/`,
//   // target:`http://localhost/issuer/`,
//   // changeOrigin: true,
//   pathRewrite: {
//     "^/issuer": ""
//   }
// };
// const exampleProxy = proxy(proxyOptions);

let endpoint = "";

const memoryStore = new session.MemoryStore();
//export NODE_ENV=production
const isProduction = process.env.NODE_ENV === "production";
const SESSION_CONF = {
  secret: "this is my super super secret, secret!! shhhh",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
  store: memoryStore,
  maxExpiration: 90000
};

if (isProduction) {
  console.log(`will set sessionstore to memcache ${process.env.MEMCACHED_URL}`);
  SESSION_CONF.store = new MemcachedStore({
    hosts: [process.env.MEMCACHED_URL],
    secret: "123, easy as ABC. ABC, easy as 123" // Optionally use transparent encryption for memcache session data
  });
}

// keycloack confniguration

const KeycloakMultiRealm = require("./back-services/KeycloakMultiRealm");

const esmoRealmConfig = {
  realm: "esmo",
  "auth-server-url": "https://esmo-gateway.eu/auth",
  "ssl-required": "none",
  resource: "test-esmo-ssi",
  credentials: {
    secret: "84528348-48d5-4fb0-a230-bb2aff6c45d4"
  },
  "confidential-port": 0
};

const eidasRealmConfig = {
  realm: "test",
  "auth-server-url": "https://dss1.aegean.gr/auth",
  "ssl-required": "none",
  resource: "testClient2",
  credentials: {
    secret: "fff6237e-5bf1-4713-8926-023180eeb0f0"
  },
  "confidential-port": 0,
  "redirect-rewrite-rules": {
    "^http://uportissuer:3000/(.*)$": "http://localhost/issuer/$1"
  }
};

const keycloak = new KeycloakMultiRealm({ store: memoryStore }, [
  esmoRealmConfig,
  eidasRealmConfig
]);

// var Keycloak = require("keycloak-connect");
// var keycloak = new Keycloak({
//   store: memoryStore
// });

//end of keycloak config

app.prepare().then(() => {
  const server = express();
  server.set("trust proxy", 1); // trust first proxy
  server.use(bodyParser.urlencoded({ extended: true }));
  server.use(bodyParser.json({ type: "*/*" }));
  // server.use(multer()); // for parsing multipart/form-data
  // //urlencoded

  // set session managment
  if (process.env.HTTPS_COOKIES === true) {
    SESSION_CONF.cookie.secure = true; // serve secure cookies, i.e. only over https, only for production
  }
  server.use(session(SESSION_CONF));
  server.use(keycloak.middleware());

  // if(!dev){
  //   // server.use(['/issuer', '/_next', '/static'], exampleProxy)
  //   server.use(['/issuer?', ], exampleProxy)
  // }

  //start server sent events for the server
  server.get("/events", subscribe);

  server.post("/makeConnectionRequest", (req, res) => {
    req.endpoint = endpoint;
    return makeConnectionRequest(req, res);
  });

  // accepts a connection request response
  server.post("/cacheUserConnectionRequest", (req, res) => {
    return cacheUserConnectionRequest(req, res);
  });

  server.post("/issueVCReq", (req, res) => {
    // console.log("server.js issueVCReq");
    // console.log(`server.js-issueVCReq::found existing session ${req.session.id}`);
    req.endpoint = endpoint;
    req.baseUrl = process.env.BASE_PATH;
    if (req.session.id) {
      // console.log(`requested new VC issuance  on session ${req.session.id}`);
      // console.log(`with data`);
      // console.log(req.body.data);
      return issueVc(req, res);
    }
  });

  // credentials-issuance-connectionResponse
  server.post("/requestIssueResponse", (req, res) => {
    console.log(`server.hs requestIssueResponse called!!`);
    req.session.baseUrl = process.env.BASE_PATH;
    return credentialsIssuanceConnectionResponse(req, res);
  });

  server.get(["/home", "/"], (req, res) => {
    console.log(`server.js-home::found existing session ${req.session.id}`);
    //TODO make an API call here usinsg a redirection parameter to get the
    // user attributes from the backend
    //TODO format of these data
    const mockData = {
      eduGAIN: {
        isStudent: "true",
        source: "eduGAIN",
        loa: "low"
      },
      TAXISnet: {
        name: "Nikos",
        surname: "Triantafyllou",
        loa: "low",
        source: "TAXISnet"
      }
    };
    if (!req.session.userData) req.session.userData = mockData;
    req.session.endpoint = endpoint;
    req.session.baseUrl = process.env.BASE_PATH;

    return app.render(req, res, "/", req.query);
  });

  server.get(["/attribute-selector"], (req, res) => {
    // console.log(req.session.userData);
    console.log(
      `server.js-attribute-selector::found existing session ${req.session.id}`
    );
    req.session.baseUrl = process.env.BASE_PATH;
    return app.render(req, res, "/attribute-selector", req.query);
  });

  // Protected by Keycloak Routes
  // server.get(["/test/eidas-authenticate","/issuer/test/eidas-authenticate"], keycloak.protect(), (req, res) => {
  server.get(
    ["/test/eidas-authenticate", "/issuer/test/eidas-authenticate"],
    keycloak.protect(),
    (req, res) => {
      console.log("we accessed a protected root!");
      // see mockJwt.json for example response
      const idToken = req.kauth.grant.access_token.content;
      // console.log(req.kauth.grant);
      // console.log(idToken)
      const userDetails = {
        // email: idToken.email,
        given_name: idToken.given_name,
        family_name: idToken.family_name,
        // sending_institution_page: idToken.sending_institution_page,
        // gender: idToken.gender,
        // institutional_email: idToken.institutional_email,
        person_identifier: idToken.person_identifier,
        // mobile_phone: idToken.mobile_phone,
        // sending_institution_name: idToken.sending_institution_name,
        // sending_institution_address: idToken.sending_institution_address,
        // place_of_birth: idToken.place_of_birth,
        date_of_birth: idToken.date_of_birth,
        source: "eidas",
        loa: idToken.loa
        // sending_institution_name_2: idToken.sending_institution_name_2
      };

      console.log(`server.js:: user-details`);
      if (req.session.userData) {
        console.log(`${req.session.userData}`);
        req.session.userData.eidas = userDetails;
      } else {
        req.session.userData = {};
        req.session.userData.eidas = userDetails;
      }
      req.endpoint = process.env.ENDPOINT; // this gets lost otherwise, on the server redirection
      req.session.baseUrl = process.env.BASE_PATH;
      return app.render(req, res, "/issue-eidas", req.query);
    }
  );

  server.get(
    "/test/is-student-eidas-authenticate",
    keycloak.protect(),
    (req, res) => {
      const idToken = req.kauth.grant.access_token.content;
      const userDetails = {
        given_name: idToken.given_name,
        family_name: idToken.family_name,
        person_identifier: idToken.person_identifier,
        date_of_birth: idToken.date_of_birth,
        source: "eidas",
        loa: idToken.loa
      };
      if (req.session.userData) {
        console.log(`${req.session.userData}`);
        req.session.userData.eidas = userDetails;
      } else {
        req.session.userData = {};
        req.session.userData.eidas = userDetails;
      }
      req.endpoint = endpoint; // this gets lost otherwise, on the server redirection
      req.session.baseUrl = process.env.BASE_PATH;
      return app.render(req, res, "/issue-is-student", req.query);
    }
  );

  server.get(
    "/esmo/is-student-esmo-authenticate",
    keycloak.protect(),
    (req, res) => {
      const idToken = req.kauth.grant.access_token.content;
      const userDetails = {
        eduPersonAffiliation: idToken.eduPersonAffiliation,
        source: "edugain",
        loa: idToken.loa ? idToken.loa : "low"
      };
      if (req.session.userData) {
        console.log(`${req.session.userData}`);
        req.session.userData.edugain = userDetails;
      } else {
        req.session.userData = {};
        req.session.userData.edugain = userDetails;
      }
      req.endpoint = endpoint; // this gets lost otherwise, on the server redirection
      req.session.baseUrl = process.env.BASE_PATH;
      console.log(`user details is-student-esmo-authenticate::`);
      console.log(userDetails);
      return app.render(req, res, "/issue-is-student", req.query);
    }
  );

  // Protected by the second Keycloak realm
  server.get(
    ["/academicId/academicId-authenticate"],
    keycloak.protect(),
    (req, res) => {
      console.log("this is a test");
    }
  );

  server.post("/academicId/check", async (req, res) => {
    const token = req.body.token;
    const attributeRetrievalEndpoint = process.env.ACADEMICID_TOKEN_END;
  
    try {
      let response = await axios.get(`${attributeRetrievalEndpoint}?token=${token}`);

      // .then(response => {
      let result = response.data.result;
      let inspectionResult = result.inspectionResult;
      // console.log(inspectionResult)
      const userDetails = {
        eduPersonAffiliation: inspectionResult.studentshipType,
        source: "academicId",
        loa: inspectionResult.loa ? inspectionResult.loa : "low"
      };
      if (req.session.userData) {
        console.log(`${req.session.userData}`);
        req.session.userData.academicId = userDetails;
      } else {
        req.session.userData = {};
        req.session.userData.academicId = userDetails;
      }
      req.endpoint = endpoint; // this gets lost otherwise, on the server redirection
      req.session.baseUrl = process.env.BASE_PATH;
      return app.render(req, res, "/issue-is-student", req.query);
    } catch (error) {
      console.log(error);
      return app.render(req, res, "/error", req.query);
    }
    
  });

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, err => {
    if (err) throw err;

    if (isProduction) {
      console.log(
        `running in production is ${isProduction} and port is ${port}`
      );
      endpoint = process.env.ENDPOINT;
    } else {
      ngrok.connect(port).then(ngrokUrl => {
        endpoint = ngrokUrl;
        console.log(`running, open at ${endpoint}`);
      });
    }
  });
});
