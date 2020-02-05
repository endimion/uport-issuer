/*
takes as input a set of requestedData to include in a VC,
and the data the user has already added to the data source
and generates an appropriate VC model with them
*/
function generateCredentialModel(requestedData, fetchedData) {

  console.log(`credentialModel.js:: requested`)
  console.log(requestedData)

  console.log(`credentialModel.js:: fetched`)
  console.log(fetchedData)

  let matchingUserAttributes = requestedData.reduce((initVal, attr) => {
    if (fetchedData[attr.source][attr.key]) {
      // console.log(`will add on the vc ${attr.source}, ${attr.key} with ${fetchedData[attr.source][attr.key]}`)
      //TODO business logic of generating the credentials here
      if (!initVal[attr.source]) {
        initVal[attr.source] = {};
      }
      initVal[attr.source][attr.key] = fetchedData[attr.source][attr.key];
    }
    return initVal;
  }, {});
  // ensure that loa from data sources is always included
  Object.keys(matchingUserAttributes).forEach(key => {
    if (!matchingUserAttributes[key].loa) {
      matchingUserAttributes[key].loa = fetchedData[key].loa;
    }
  });

  //ensure that linking LOA is added
  if(Object.keys(matchingUserAttributes).length > 1){
      if(fetchedData.linkLoa){
        matchingUserAttributes.linkLoa = fetchedData.linkLoa
      }else{
        matchingUserAttributes.linkLoa  = 'low'
      }
  }

  return matchingUserAttributes;
}

export { generateCredentialModel };
