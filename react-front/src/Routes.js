import React from 'react';
import { Switch } from 'react-router-dom';
import Landing from './containers/Landing';
import NotFound from './containers/NotFound';
import Login from './containers/Login';
import Dashboard from './containers/Dashboard';
import Register from './containers/Register';
import Home from './containers/Home';
import AppliedRoute from './components/AppliedRoute';

export default ({ childProps }) =>
    childProps.isAuthenticated ?
        (
            /*TODO: have here <Switch>...</Switch>  like below instead*/
            <Home {...childProps} />
        ): (
            <Switch>
                <AppliedRoute path="/" exact cProps={childProps} component={Landing} />
                <AppliedRoute path="/login" exact cProps={childProps} component={Login} />
                <AppliedRoute path="/dashboard" exact component={Dashboard} />
                <AppliedRoute path="/register" exact component={Register} props={childProps} />
                { /* Catch all unmatched routes */}
                <AppliedRoute component={NotFound} />
            </Switch>
        );