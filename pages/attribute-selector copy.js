// import { useRouter } from "next/router";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { withRedux } from "../lib/redux";
import { setEidas, setEdugain, setUserAttributeSelection } from "../store";
import Layout from "../components/Layout";
import AttributeCards from "../components/AttributeCards";

const SelectAttributes = props => {
  //   const router = useRouter();
  let dispatch = useDispatch();
  console.log(`selectAttributes props`)
  console.log(props)

  const eidas = useSelector(state => {
    console.log(`userSelector. state`);
    console.log(state);
    return state.userEidas;
  });
  const eduGain = useSelector(state => state.userEduGain);

  //   dispatch(setEidas(userSessionData.eidas)); //add the userEidas data to the reduxstore to be able to get it from other componets as well
  //   dispatch(setEdugain(userSessionData.eduGAIN)); //add the userEdugain data to the reduxstore to be able to get it from other componets as well
  //   dispatch(setUserAttributeSelection([]));

  if (props.sessionData && (props.sessionData.eidas || props.sessionData.eduGain)) {
    return (
      <Layout>
        <AttributeCards sources={[props.sessionData.eidas, props.sessionData.eduGain]} />
      </Layout>
    );
  } else {
    return (
      <Layout>
        <div>No user attributes found</div>
      </Layout>
    );
  }
};

SelectAttributes.getInitialProps = async function({ reduxStore, req }) {
  let userSessionData = null;
  if (typeof window === "undefined") {
    // we are running server side!
    console.log(`running inside the server -- attribute-selector`);
    // get sessionData from session
    console.log(`req.session`);
    console.log(req.session);
    userSessionData = req.session.userData;
  } else {
    console.log(`selectAttributes running inside the browser`);
    console.log(`reduxStore is `);
    //state here did not contain the attributes!!!
    console.log(reduxStore.getState());
  }

  //returned value here is getting mered with the mapstatetoprops
  // mapstatetoprops overrides these values if they match
  if (userSessionData) {
    return {
      isFetching: reduxStore.getState().fetching,
      sessionData: userSessionData,
      userEidas: userSessionData.eidas,
      userEduGain: userSessionData.edugain,
      userSelection: userSessionData.userSelection,
      qrData: reduxStore.getState().qrData
    };
  } else {
    // if no userSessionData is set in server session
    return {};
  }
};

export default withRedux(SelectAttributes);
