import React, { Component } from 'react';
import * as api from '../shared/api';
import Select from 'react-select';


class EditGroups extends Component {
    constructor(props) {
        super(props);
        this.state = {
            groups: [],
            selectedGroup: -1,
            facultySelect: [],
            faculty: [],
            submitting: false
        }
    }

    componentDidMount() {
        api.getAllVisibleGroups()
            .then(groups_ => {
                //groups with UPDATE permission
                //only concerned with name and id
                const groups = groups_.filter(g => g.permission === 'UPDATE')
                    .map(g => ({id:g.id, name: g.name}));
                
                this.setState({groups: groups});
            });

            api.getFaculty().then(res => {
                let objectApp = [];
          
                for (let i = 0; i < res.faculties.length; i++) {
                  const fac = res.faculties[i];
          
                  objectApp.push({
                    label: fac.fname + " " + fac.lname,
                    value: fac.lname,
                    id: fac.id,
                    cwid: fac.cwid
                  });
                }
          
                this.setState({ faculty: objectApp });
              });
            
    }

    handleGroupSelectChange = e => {
        const groupId = e.target.value;
        console.log(groupId);
        this.setState({selectedGroup: groupId});


    }

    handleFacultySelectChange = (k, change) => {
        let facultySelect = this.state.facultySelect;
  
        if (change.action === 'remove-value' || change.action === 'pop-value') {
          const optionData = change.removedValue;
  
          facultySelect = facultySelect.filter(f => f.id !== optionData.id);
        } else if (change.action === 'select-option') {
          const optionData = change.option;
          
          facultySelect = [...facultySelect, optionData];
        } else if (change.action === 'clear') {
            facultySelect = [];
        }
  
        this.setState({
            facultySelect
        });
    }
   
    resetState = () => {
        this.setState({
            groups: [],
            selectedGroup: -1,
            faculty: [],
            facultySelect: [],
            submitting: false
        });
    }


    handleSubmit1 = () => {
        const { selectedGroup, facultySelect, submitting } = this.state;
        if (submitting) return;

        this.setState({submitting: true}, () => {
            if (selectedGroup === -1) {
                alert('Please select group'); 
                this.setState({submitting: false});
                return;
            }

            const cwids = facultySelect.map(d => d.cwid);
            const groupId = selectedGroup;
            console.log(groupId);
            api.addGroupMembers(groupId, cwids)
                .then(() => {
                    alert('success');
                })
                .catch(error => {
                    alert(error.message);
                })
                .finally(() => {
                    this.setState({submitting: false, csvData: []});
                })
        })        
    }

    handleSubmit2 = () => {
        const { selectedGroup, facultySelect, submitting } = this.state;
        if (submitting) return;

        this.setState({submitting: true}, () => {
            if (selectedGroup === -1) {
                alert('Please select group'); 
                this.setState({submitting: false});
                return;
            }

            const cwids = facultySelect.map(d => d.cwid);
            const groupId = selectedGroup;
            console.log(groupId);
            api.removeGroupMembers(groupId, cwids)
                .then(() => {
                    alert('success');
                })
                .catch(error => {
                    alert(error.message);
                })
                .finally(() => {
                    this.setState({submitting: false});
                })
        })        
    }

    render() {
        const { groups } = this.state;
        console.log(this.state.selectedGroup);


        return (
            <div className="container">
                <h3>Select Groups to edit</h3>
                <select onChange={this.handleGroupSelectChange}>
                    <option value={-1}>Select Group</option>
                    {
                        groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))
                    }
                </select>
                <br />
                <br />

                <header className="App-header">
            <h3 className="App-title">Select name to add members</h3>
          </header>
          <Select
            name="form-field-name"
            value={this.state.facultySelect}
            isMulti
            onChange={this.handleFacultySelectChange}
            searchable={this.state.searchable}
            options={this.state.faculty}
          />

                <button onClick={this.handleSubmit1} >Submit</button>


                <header className="App-header">
            <h3 className="App-title">Select name to remove members</h3>
          </header>
          <Select
            name="form-field-name"
            value={this.state.facultySelect}
            isMulti
            onChange={this.handleFacultySelectChange}
            searchable={this.state.searchable}
            options={this.state.faculty}
          />

                <button onClick={this.handleSubmit2} >Submit</button>
            </div>
        );
    }
}
export default EditGroups;