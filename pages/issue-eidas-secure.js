import React from "react";
import {
  setSessionData,
  makeConnectionRequest,
  addSetToSelection,
  setStepperSteps
} from "../store";
import Layout from "../components/Layout";
import { connect } from "react-redux";
import Link from "next/link";
import { Button, Row, Col, Card, Container } from "react-bootstrap";
import MyStepper from "../components/Stepper";
import QrPrompt from "../components/QrPrompt";
import SSE from "../components/Sse";

class IssueEidas extends React.Component {
  constructor(props) {
    super(props);
    this.dispatch = props.dispatch;
    this.isFetching = props.isFetching;
    this.sessionData = props.sessionData;
  }

  static async getInitialProps({ reduxStore, req }) {
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
    if (userSessionData) {
      reduxStore.dispatch(setSessionData(userSessionData));
    }
    //returned value here is getting mered with the mapstatetoprops
    // mapstatetoprops overrides these values if they match
    return {
      sessionData: userSessionData,
      qrData: reduxStore.getState().qrData
    };
  }

  componentDidMount() {
    this.props.sendConnectionRequest();

    if (this.props.sessionData && this.props.sessionData.eidas) {
      let toSelect = [this.props.sessionData.eidas];
      this.props.setEidasToSelection(toSelect);
      this.props.setSteps([
        { title: 'Authenticate over "eIDAS-eID"' },
        { title: "Request Issuance" },
        { title: "Accept Verifiable Credential" }
      ]);
    }
  }

  render() {
    const usersDID = this.props.sessionData;
    let result ="";

    const hasRequiredAttributes =
      this.props.sessionData !== null &&
      this.props.sessionData !== undefined &&
      this.props.sessionData.eidas !== undefined;

    console.log(
      `issue-eidas.js:: hasRequiredAttributes ${hasRequiredAttributes} `
    );

    let eIDASLoginButton = !hasRequiredAttributes ? (
      <a
        className="btn btn-primary"
        href="/test/eidas-authenticate"
        role="button"
      >
        eIDAS
      </a>
    ) : (
      <Button variant="primary" disabled>
        eIDAS
      </Button>
    );

    let eidasCard = (
      <Card className="text-center" style={{ marginTop: "2rem" }}>
        <Card.Header>Issue an eIDAS based Verifiable Credential</Card.Header>
        <Card.Body>
          <Card.Title>
            {hasRequiredAttributes
              ? "Credentials Issuance is ready!"
              : "Please authenticate to the required data sources"}
          </Card.Title>
          <Card.Text>
            Once you have authenticated through the required data sources, click
            the "Issue" button to generate and receive your VC .
          </Card.Text>
          <Container>
            <Row>
              <Col>{eIDASLoginButton}</Col>
              <Col>
                <Link href="/issue">
                  <Button variant="primary" disabled={!hasRequiredAttributes}>
                    Issue Verifiable Claim
                  </Button>
                </Link>
              </Col>
            </Row>
          </Container>
        </Card.Body>
        {/* <Card.Footer className="text-muted">2 days ago</Card.Footer> */}
      </Card>
    );
    let stepNumber = hasRequiredAttributes ? 1 : 0;
    let stepperSteps = [
      { title: 'Authenticate over "eIDAS-eID"' },
      { title: "Request Issuance" },
      { title: "Accept Verifiable Credential" }
    ];

    if (this.props.qrData && !this.props.vcSent) {
      result = (
        <div>
          <QrPrompt
            qrData={this.props.qrData}
            message={"SEAL is requesting to connect your uPort wallet:"}
            permissions={["Push Notifications"]}
          />
          <SSE uuid={this.props.uuid} endpoint={this.props.endpoint} />
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
              steps={stepperSteps}
              activeNum={stepperSteps.length - 1}
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

    // return (
    //   <Layout>
    //     <Row>
    //       <Col>
    //         <MyStepper
    //           steps={stepperSteps}
    //           activeNum={stepNumber}
    //           // completeColor={"#00c642"}
    //         />
    //       </Col>
    //     </Row>
    //     {eidasCard}
    //   </Layout>
    // );
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
    setEidasToSelection: set => {
      dispatch(addSetToSelection(set));
    },
    setSteps: steps => {
      dispatch(setStepperSteps(steps));
    },
    sendConnectionRequest: data => {
      dispatch(makeConnectionRequest(data));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(IssueEidas);
