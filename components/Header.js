import Link from "next/link";
import { Container, Row, Navbar } from "react-bootstrap";

const linkStyle = {
  marginRight: 15
};

const Header = () => (
  <Container fluid>
    <Navbar expand="sm" bg="dark" variant="dark" >
      <Navbar.Brand href="/">
        <img
          alt=""
          src="/gunet_logo.png"
          width="100"
          height="40"
          className="d-inline-block align-top"
        />{" "}
         SEAL VC Issuer
      </Navbar.Brand>
    </Navbar>
  </Container>
);

export default Header;
