import React from "react";
import Link from "next/link";
import { connect } from "react-redux";
import Layout from "../components/Layout";
import QrPrompt from "../components/QrPrompt";
import MyStepper from "../components/Stepper";
import SSE from "../components/Sse";
const message = require("uport-transports").message.util;
const transport = require("uport-transports").transport;
import { requestVCgeneration } from "../store";
import { Button, Row, Col } from "react-bootstrap";
import isMobile from "../helpers/isMobile";
import Router from 'next/router'

class Issue extends React.Component {
  constructor(props) {
    super(props);
    this.dispatch = props.dispatch;
    this.isFetching = props.isFetching;
    this.sessionData = props.sessionData;
    this.userSelection = props.userSelection;
    this.endpoint = props.endpoint;
    this.requestVC = this.requestVC.bind(this);
  }

  componentDidMount() {
    if (this.props.userSelection.length > 0) {
      this.requestVC();
    }
  }

  requestVC() {
    console.log(`will request the creation of a requestVC`);
    this.props.makeIssueRequest(
      `${this.props.baseUrl}issueVCReq`,
      this.props.userSelection,
      isMobile()
    );
  }

  render() {
    let result;

    if (this.props.userSelection.length > 0) {
      if (this.props.vcSent) {
        result = (
          <div className={"row"}>
            <div
              className={"col"}
              style={{
                marginTop: "3rem",
                marginBottom: "3rem",
                textAlign: "center"
              }}
            >
              <img
                alt=""
                src="/finished.png"
                style={{
                  maxWidth: "15rem",
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto"
                }}
              />
              <p>
                The verifiable credential has been sent to your mobile phone
                succesfully!!
                <br />
                You should receive a notification, prompting you to store it,
                very soon!
              </p>
            </div>
          </div>
        );
      }

      if (this.props.qrData && isMobile()) {
        const urlTransport = transport.url.send();
        urlTransport(this.props.qrData);
        // tranport.url.onResponse().then(res => {
        //   const payload = res.payload;
        //   const id = res.id;
        //   console.log(
        //     "issue.js:: got response in mobile!! how do we handle this??"
        //   );
        //   //after the response go back home!
        //   Router.push('/home')
        // });
        Router.push(`${this.props.baseUrl}`)
      }

      if (this.props.qrData && !this.props.vcSent) {
        let sseEndpoint = this.props.baseUrl
          ? `${this.props.endpoint}/${this.props.baseUrl}`
          : this.props.endpoint;
        result = (
          <div>
            <QrPrompt
              qrData={this.props.qrData}
              message={"SEAL is requesting to connect your uPort wallet:"}
              permissions={["Push Notifications"]}
            />
            <SSE uuid={this.props.uuid} endpoint={sseEndpoint} />
          </div>
        );
      }

      if (this.props.isFetching && !this.props.qrData && !this.props.vcSent) {
        result = <div className={"row"}>Generating QR code please wait</div>;
      }

      return (
        <Layout>
          <Row>
            <Col>
              <MyStepper
                steps={this.props.stepperSteps}
                activeNum={this.props.stepperSteps.length - 1}
                // completeColor={"#00c642"}
              />
            </Col>
          </Row>

          {result}
          <div className="col">
            <Link href="/">
              <Button variant="primary" className="float-right">
                Home
              </Button>
            </Link>
          </div>
        </Layout>
      );
    } else {
      return (
        <Layout>
          <div className={"row"}>user made no selections!</div>
        </Layout>
      );
    }
  }
}

function mapStateToProps(state) {
  console.log("issue.js:: mapping state to props");
  console.log(state);
  return {
    isFetching: state.fetching,
    qrData: state.qrData,
    uuid: state.uuid,
    // userEidas: state.userEidas, // the eIDAS attributes of the user
    // userEduGain: state.userEduGain, // the eduGain attributes of the user
    sessionData: state.sessionData,
    userSelection: state.userSelection, // the attributes selected by the user to be included in a VC,
    vcSent: state.vcSent,
    stepperSteps: state.stepperSteps,
    endpoint: state.endpoint,
    baseUrl: state.baseUrl
  };
}

const mapDispatchToProps = dispatch => {
  return {
    makeIssueRequest: (url, data, isMobile = false) => {
      dispatch(requestVCgeneration(url, data, isMobile));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Issue);
