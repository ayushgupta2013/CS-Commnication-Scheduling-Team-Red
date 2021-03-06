import React, { Component } from 'react';

//React-Bootstrap
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import * as api from '../shared/api';

import './CreateEvent.css';
import './Login.css';

export default class CreateStudent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cwid: -1,
            fname: "",
            lname: "",
            username: "",
            email: "",
            password: ""
        }
    }

    handleChange = event => {
        this.setState({
            [event.target.id]: event.target.value
        });
    }

    resetState = () => {
        this.setState({
            cwid: -1,
            fname: "",
            lname: "",
            username: "",
            email: "",
            password: ""
        });
    }

    handleSubmit = e => {
        e.preventDefault();
        const { cwid, fname, lname, username, email, password } = this.state;

        api.createStudent({cwid, fname, lname, username, email, password})
            .then(() => { alert('The student account has been successfully created.'); this.resetState(); })
            .catch(err => { alert("The student account could not be created. " + err.message); })
    }

    render() {
        return(
            <div className="bg">
            <Form className="container panel-default" onSubmit={this.handleSubmit} style={{ padding: 1 + 'em' }}>
                <h2>Create Student</h2><br />
                <Form.Group controlId="cwid">
                    <Form.Label>CWID:</Form.Label>
                    <Form.Control
                        autoFocus
                        type="number"
                        placeholder="CWID"
                        value={this.state.cwid}
                        onChange={this.handleChange}
                    />
                </Form.Group>

                <Form.Group controlId="fname">
                    <Form.Label>First Name:</Form.Label>
                    <Form.Control
                        autoFocus
                        value={this.state.fname}
                        placeholder="First Name"
                        onChange={this.handleChange}
                    />
                </Form.Group>

                <Form.Group controlId="lname">
                    <Form.Label>Last Name:</Form.Label>
                    <Form.Control
                        autoFocus
                        value={this.state.lname}
                        placeholder="Last Name"
                        onChange={this.handleChange}
                    />
                </Form.Group>

                <Form.Group controlId="username">
                    <Form.Label>Username:</Form.Label>
                    <Form.Control
                        autoFocus
                        value={this.state.username}
                        placeholder="Username"
                        onChange={this.handleChange}
                    />
                </Form.Group>

                <Form.Group controlId="email">
                    <Form.Label>Email address:</Form.Label>
                    <Form.Control
                        autoFocus
                        value={this.state.email}
                        placeholder="Email"
                        onChange={this.handleChange}
                    />
                </Form.Group>

                <Form.Group controlId="password">
                    <Form.Label>Password:</Form.Label>
                    <Form.Control
                        autoFocus
                        value={this.state.password}
                        placeholder="Password"
                        onChange={this.handleChange}
                    />
                </Form.Group>

                <Button type="reset" onClick={this.resetState}>
                    Reset
                </Button>

                <Button className="button-padding" variant="primary" type="submit">
                    Submit
                </Button>
            </Form>
            </div>
        );
    }
}
