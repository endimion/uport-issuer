import Link from 'next/link';
import {Navbar} from 'react-bootstrap';
 
const linkStyle = {
  marginRight: 15
};

const Header = () => (
  <Navbar bg="dark" variant="dark">
    <Navbar.Brand href="#home">
      <img
        alt=""
        src="/gunet_logo.png"
        width="100"
        height="40"
        className="d-inline-block align-top"
      />{' '}
      Welcome to the SEAL Verifiable Credential Issuer Service
    </Navbar.Brand>
  </Navbar>
);

export default Header;
