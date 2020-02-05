import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  InputGroup
} from "react-bootstrap";

const AttributeCards = props => {
  // console.log(`attributecards.js`);
  // console.log(props);
  let attributeSources = props.sources;
  let maxPerRow = 2;
  let index = 0;
  let attributeSourcesRow = attributeSources.reduce((initVal, attribute) => {
    if (initVal[index] === undefined) initVal[index] = [];
    if (initVal[index].length < maxPerRow) {
      initVal[index].push(attribute);
    } else {
      // console.log(`will add  new row`);
      index++;
      initVal[index] = [];
      initVal[index].push(attribute);
    }
    return initVal;
  }, []);

  //each row has two elements
  let keyIds = 0;
  let rows = attributeSourcesRow.map(attrRow => {
    keyIds++;
    let internalRow = attrRow.map(attr => {
      let properties = [];
      if (attr) {
        for (const [key, value] of Object.entries(attr)) {
          // console.log(`attribute ${key} with index ${index}`)
          let match = props.userSelection.find(sel => {
            return attr.source === sel.source && key === sel.key;
          });
          // console.log(`match for ${key} is ${match}`)
          let rowStyle = match
            ? {
                backgroundColor: "darkcyan",
                color: "white",
                fontWeight: "bold"
              }
            : {};
          let checked = (match)?true:false
          if (key !== "source" && key !== "loa")
            properties.push(
              <Container key={key}>
                <ListGroup.Item key={key} style={rowStyle}>
                  <Row>
                    <Col xs={6} key={key} style={{ fontSize: "smaller" }}>
                      {key} :
                    </Col>
                    <Col xs={4} key={value} style={{ fontSize: "smaller" }}>
                      {value}
                    </Col>
                    <Col xs={2} style={{ float: "right" }} key={"select"}>
                      <InputGroup.Append
                        className="floatRight"
                        style={{ float: "right!important" }}
                      >
                        <InputGroup.Checkbox
                          aria-label="Checkbox for selecting a single attribute"
                          onChange={() => {
                            props.clickCheckbox(key, attr.source);
                          }}
                          checked={checked}
                        />
                      </InputGroup.Append>
                      <style jsx global>{`
                        .floatRight {
                          float: right;
                        }
                      `}</style>
                    </Col>
                  </Row>
                </ListGroup.Item>
              </Container>
            );
          index++;
        }
      }

      return (
        <Col xs={6} key={attr.source} style={{ marginBottom: "1rem" }}>
          <Card>
            <Card.Body>
              <Card.Title>
                <Container>
                  <Row>
                    <Col key={"checkBox"} style={{ maxWidth: "10%" }}>
                      <InputGroup.Prepend>
                        <InputGroup.Checkbox
                          aria-label="Checkbox for selecting all attributes"
                          onChange={() => {
                            props.clickedCardCheckBox(attr.source)
                          }}
                        />
                      </InputGroup.Prepend>
                    </Col>
                    <Col
                      key={"name"}
                      style={{ maxWidth: "90%" }}
                      className="text-align-center"
                    >
                      {attr.source}
                    </Col>
                    <style jsx global>
                      {`
                        .text-align-center {
                          text-align: center;
                        }
                      `}
                    </style>
                  </Row>
                </Container>
              </Card.Title>
              <Card.Subtitle className="mb-2 text-muted">
                Attributes retrieved from {attr.source}
              </Card.Subtitle>
              <ListGroup variant="flush">{properties}</ListGroup>
            </Card.Body>
          </Card>
        </Col>
      );
    });
    return <Row key={keyIds}> {internalRow} </Row>;
  });

  return <Container style={{ marginTop: "2rem" }}>{rows}</Container>;
};

export default AttributeCards;
