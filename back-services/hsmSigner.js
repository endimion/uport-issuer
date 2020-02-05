const hash256 = require("hash.js");
const EC = require("elliptic").ec;
import { verifyJWT } from "did-jwt";
// for testing
const Resolver = require('did-resolver')
// const ethrDid =  require('ethr-did-resolver').getResolver()
// end testing dependecies
const secp256k1 = new EC("secp256k1");

function sha3_256Hash(msg) {
  let hashBytes = hash256
    .sha256()
    .update(msg)
    .digest();
  return new Buffer(hashBytes);
}

function leftpad(data, size = 64) {
  if (data.length === size) return data;
  return "0".repeat(size - data.length) + data;
}

//this basically abstracts an API call to the HSM API
async function sign(data) {
  const _privateKey =
    "e9f5744f436eeb3f8be13c694beabecf7014c3291dc5c0fe6d8f540810ff5170";

  
  // Buffer.from(_privateKey, "hex", 32).toString();
  const privateKey = secp256k1.keyFromPrivate(_privateKey, "hex");

  const { r, s, recoveryParam } = secp256k1.sign(
    sha3_256Hash(data),
    privateKey
  );
  return {
    r: leftpad(r.toString("hex")),
    s: leftpad(s.toString("hex")),
    recoveryParam
  };
}

/*
A successfull call returns an object containing the following attributes:
r	Hex encoded r value of secp256k1 signature	yes
s	Hex encoded s value of secp256k1 signature	yes
recoveryParam	Recovery parameter of signature (can be used to calculate signing public key)	only required for (ES256K-R)
*/
function mySigner(data) {
  return new Promise((resolve, reject) => {
    const signature = sign(data); /// sign it over an API call HSM...
    resolve(signature); 
  });
}

// function test() {
//   let resolver = new Resolver.Resolver(ethrDid)
//   verifyJWT(
//     "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1NzE5MDQ0MTEsImV4cCI6MTU3MTkwNTAxMSwicGVybWlzc2lvbnMiOlsibm90aWZpY2F0aW9ucyJdLCJjYWxsYmFjayI6Imh0dHBzOi8vN2MwOThmZTIubmdyb2suaW8vY2FsbGJhY2siLCJ0eXBlIjoic2hhcmVSZXEiLCJpc3MiOiJkaWQ6ZXRocjoweGQ1MDJhMmM3MWU4YzkwZTgyNTAwYTcwNjgzZjc1ZGUzOGQ1N2RkOWYifQ.aLWdbgUkYFikrfdLn1E5DUJrcCcIkdf40lPgpwF8GCnes975tfWxaALhrBcTRfevS33yj0LZWP-aoZeWzkkEXAE",
//     {resolver: resolver}).then((response) => {
//     console.log(response);
//   });
// }

export {  mySigner };
