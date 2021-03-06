import React, { Component } from 'react';
import * as api from '../shared/api';
import Select from 'react-select';

import Button from 'react-bootstrap/Button';

const PERMISSION_OPTIONS_READ = [
    {label: 'View only', value: 'READ'}
];

const PERMISSION_OPTIONS_UPDATE = [
    {label: 'Edit/View', value: 'UPDATE'},
    {label: 'View only', value: 'READ'}
];

export default class ShareCalendar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            groups: [],
            permissions: [],
            faculties: [],
            selectedGroup: null,
            selectedPermission: null,
            selectedFaculty: null
        }
    }

    componentDidMount() {
        api.getFaculties().then(faculties => {

            faculties = faculties.map(f => ({
                label: f.fname + ' ' + f.lname,
                value: f.id,
            }));

            api.getAllVisibleGroups().then(groups => {
                groups = groups.map(g => ({
                    label: g.name,
                    value: g.id,
                    permission: g.permission
                }));

                this.setState({faculties, groups, permissions: [] });
            })
        })
    }

    share = () => {
        const { selectedGroup, selectedPermission, selectedFaculty } = this.state;
        if (!selectedGroup) { alert('Please select group'); return; }
        if (!selectedPermission) { alert('Please select permission'); return; }
        if (!selectedFaculty) { alert('Please select faculty'); return; }

        api.shareGroup({
            groupId: selectedGroup.value,
            userId: selectedFaculty.value,
            permission: selectedPermission.value
        })
            .then(() => {
                alert('success');
            })
            .catch(err => {
                alert(err.message);
            });
    }

    handleGroupSelectionChange = selectedGroup => {
        const permissions = selectedGroup? 
            (selectedGroup.permission === 'UPDATE'? 
                PERMISSION_OPTIONS_UPDATE: 
                PERMISSION_OPTIONS_READ): [];
        const selectedPermission = null;
        this.setState({selectedGroup, permissions, selectedPermission});        
    }

    handlePermissionSelectionChange = selectedPermission => {
        this.setState({selectedPermission});
    }

    handleFacultySelectionChange = selectedFaculty => {
        this.setState({selectedFaculty});
    }

    render() {
        //console.log(this.state.faculty);
        return(
            <div className="bg">
                <div className="container panel-default">
                    <header className="App-header">
                            <h3 className="App-title">Share Group</h3>
                    </header>
                        
                    <div>
                        <h4>Select Group</h4>
                        <Select
                            onChange={this.handleGroupSelectionChange}
                            value={this.state.selectedGroup}
                            options={this.state.groups}
                        />
                    </div>

                    <div>
                        <h4>Select Permission</h4>
                        <Select
                            onChange={this.handlePermissionSelectionChange}
                            value={this.state.selectedPermission}
                            options={this.state.permissions}
                        />
                    </div>

                    <div>
                        <h4>Select Faculty</h4>
                        <Select
                            onChange={this.handleFacultySelectionChange}
                            value={this.state.selectedFaculty}
                            options={this.state.faculties} 
                        />
                    </div>

                    <Button style={{ marginTop: 0.5 + 'em' }} variant="primary" type="submit" onClick={this.share}>
                        Share
                    </Button>
                </div>   
            </div> 
        );
    }
}