import React from 'react';
import * as authService from '../shared/authService';

const NavItem = props => {
  const pageURI = window.location.pathname+window.location.search
  const liClassName = (props.path === pageURI) ? "nav-item active" : "nav-item";
  const aClassName = props.disabled ? "nav-link disabled" : "nav-link"
  return (
    <li className={liClassName}>
      <a href={props.path} className={aClassName}>
        {props.name}
        {(props.path === pageURI) ? (<span className="sr-only">(current)</span>) : ''}
      </a>
    </li>
  );
}

class NavDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isToggleOn: false
    };
  }
  showDropdown(e) {
    e.preventDefault();
    this.setState(prevState => ({
      isToggleOn: !prevState.isToggleOn
    }));
  }
  render() {
    const classDropdownMenu = 'dropdown-menu' + (this.state.isToggleOn ? ' show' : '')
    return (
      <li className="nav-item dropdown">
        <a className="nav-link dropdown-toggle" href="/" id="navbarDropdown" role="button" data-toggle="dropdown"
          aria-haspopup="true" aria-expanded="false"
          onClick={(e) => {this.showDropdown(e)}}>
          {this.props.name}
        </a>
        <div className={classDropdownMenu} aria-labelledby="navbarDropdown">
          {this.props.children}
        </div>
      </li>
    )
  }
}


class AuthenticatedNavigation extends React.Component {
  render() {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <a className="navbar-brand" href="/">CS Communication System</a>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">            
            <NavItem path="/dashboard" name="Dashboard" />
            
            <NavDropdown name="Calendar">
                <a className="dropdown-item" href="/notfound">Share</a>
                <a className="dropdown-item" href="/notfound">Export</a>
                <a className="dropdown-item" href="/notfound">Edit</a>
            </NavDropdown>

            <NavDropdown name="Messages">
                <a className="dropdown-item" href="/notfound">View Messages</a>
            </NavDropdown>

            <NavDropdown name="Events">
                <a className="dropdown-item" href="/createEvent">Create Event</a>
            </NavDropdown>

            <NavDropdown name="Appointment">
                <a className="dropdown-item" href="/Appointment">Appointment</a>
            </NavDropdown>

            <NavDropdown name="Groups">
                <a className="dropdown-item" href="/notfound">View Current Groups</a>
                <a className="dropdown-item" href="/notfound">Create New Group</a>
            </NavDropdown>
            
          </ul>
          <ul className="navbar-nav ml-auto">
              <NavItem  path="/logout" name="Logout" />            
          </ul>
        </div>
      </nav>
    )
  }
}

class UnaunthenticatedNavigation extends React.Component {
  render() {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <a className="navbar-brand" href="/">CS Communication System</a>
      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        <ul className="navbar-nav ml-auto">
          <NavItem path="/register" name="Register" />
          <NavItem path="/login" name="Login" />
        </ul>
      </div>
    </nav>
    )
  }
}

export default class Navigation extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
          authenticated: authService.isAuthenticated()
      }
    }

    componentDidMount() {
      // ... that takes care of the subscription...
      authService.registerAuthStatusChangeListener(this.onAuthStatusChanged);
    }

    componentWillUnmount() {
        authService.unregisterAuthStatusChangeListener(this.onAuthStatusChanged);
    }

    onAuthStatusChanged = () => {
        this.setState({authenticated: authService.isAuthenticated()});
    }

    render() {
      const { authenticated } = this.state;
      return authenticated? <AuthenticatedNavigation />: <UnaunthenticatedNavigation />
    }
}
