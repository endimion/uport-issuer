// import { useRouter } from "next/router";
import React from "react";
import {
  setUserAttributeSelection,
  setSessionData,
  addToSelection,
  addSetToSelection,
  removeFromSelection
} from "../store";
import Layout from "../components/Layout";
import AttributeCards from "../components/AttributeCards";
import { connect } from "react-redux";
import Link from "next/link";
import { Row, Button } from "react-bootstrap";

class SelectAttributes extends React.Component {
  constructor(props) {
    super(props);
    this.dispatch = props.dispatch;
    this.isFetching = props.isFetching;
    this.sessionData = props.sessionData;
    this.userEidas = props.userEidas;
    this.userEduGain = props.userEduGain;
    this.userSelection = props.userSelection;
    this.clickedCheckbox = this.clickedCheckbox.bind(this);
    this.clickedCardCheckBox = this.clickedCardCheckBox.bind(this);
  }

  static async getInitialProps({ reduxStore, req }) {
    const serverIsFetching = reduxStore.getState().fetching;
    let userSessionData;
    if (typeof window === "undefined") {
      userSessionData = req.session.userData;
    } else {
      if (reduxStore.getState().sessionData) {
        userSessionData = reduxStore.getState().sessionData;
      } else {
        console.log(`no server session data found`);
      }
    }

    // console.log(userSessionData);
    if (userSessionData) {
      reduxStore.dispatch(setUserAttributeSelection([]));
      reduxStore.dispatch(setSessionData(userSessionData));
    }

    //returned value here is getting mered with the mapstatetoprops
    // mapstatetoprops overrides these values if they match
    return {
      isFetching: serverIsFetching,
      sessionData: userSessionData,
      qrData: reduxStore.getState().qrData
    };
  }
  componentDidMount() {
    const { dispatch, sessionData } = this.props;
    // console.log(`attribute-selector:: after mounting:`)
    // console.log(this.props.userSelection)
  }

  componentWillUnmount() {}

  clickedCheckbox(key, source) {
    ////if element is already added remove from selection
    console.log(
      `attribute-selector.js:: clickedCheckbox with ${key} ${source}`
    );
    let match = this.props.userSelection.find(sel => {
      return source === sel.source && key === sel.key;
    });
    if (match) {
      console.log(
        `will remove from userSelection index ${this.props.userSelection.indexOf(
          match
        )}`
      );
      this.props.onChangeRemoveFromSelection(
        this.props.userSelection.indexOf(match)
      );
    } else {
      // console.log(`will add element of index ${index} and source ${source}`);
      this.props.onChangeAddToSelection(key, source);
    }
  }

  clickedCardCheckBox(source) {
    console.log(
      `attribute-selector.js clicked cardCheckBox for source ${source}`
    );
    let attributeSources = Object.keys(this.props.sessionData).map(key => {
      // console.log(`will fetch key ${key} from` )
      return this.props.sessionData[key];
    });
    console.log(attributeSources);
    // attributeSources.forEach
    let toSelect = attributeSources.reduce((initVal, attributes) => {
      console.log(`checking ${attributes.source} against ${source}`);
      if (attributes.source === source) {
        initVal.push(attributes);
      }
      return initVal;
    }, []);

    this.props.onChangeBigTickBox(toSelect);
  }

  render() {
    // console.log(`sessionData`);
    // console.log(this.props.sessionData);
    let _sessionData = this.props.sessionData;
    if (_sessionData) {
      let attributeSourcesArray = Object.keys(_sessionData).map(key => {
        // console.log(`will fetch key ${key} from` )
        return _sessionData[key];
      });
      // console.log(`attributeSourcesArray`);
      // console.log(attributeSourcesArray);
      return (
        <Layout>
          <AttributeCards
            sources={attributeSourcesArray}
            clickCheckbox={this.clickedCheckbox}
            clickedCardCheckBox={this.clickedCardCheckBox}
            userSelection={this.props.userSelection}
          />
          <Row>
            <div className="col">
              <Link href="/issue">
                <Button variant="primary" className="float-right">
                  Issue Verifiable Claim
                </Button>
              </Link>
            </div>
          </Row>
        </Layout>
      );
    } else {
      return (
        <Layout>
          <div>No user attributes found</div>
        </Layout>
      );
    }
  }
}

function mapStateToProps(state) {
  return {
    isFetching: state.fetching,
    qrData: state.qrData,
    sessionData: state.sessionData,
    userSelection: state.userSelection // the attributes selected by the user to be included in a VC
  };
}

const mapDispatchToProps = dispatch => {
  return {
    onChangeAddToSelection: (index, source) => {
      dispatch(addToSelection(index, source));
    },
    onChangeRemoveFromSelection: index => {
      dispatch(removeFromSelection(index));
    },
    onChangeBigTickBox: data => {
      dispatch(addSetToSelection(data));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SelectAttributes);
