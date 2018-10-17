import PropTypes from "prop-types";
import React, {Component} from 'react';
import {
  Page,
  Grid, Table
} from "tabler-react";
import {
  Row,
  Col,
  FormGroup,
  Label,
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardFooter,
  ListGroup,
  ListGroupItem
} from "reactstrap";


class ContractDebugger extends Component {

  constructor(props) {
    super(props);
  }

  handleChange(e) {
    this.setState({txHash: e.target.value});
  }

  debug(e) {
    this.props.startDebug(this.state.txHash);
  }

  debugNext(e) {
    this.props.debugNext();
  }

  debugPrevious(e) {
    this.props.debugPrevious();
  }

  render() {
    return (
      <Page.Content title={this.props.contract.className + ' Debugger'}>
        <Grid.Row>
          <Grid.Col>
            <Input name="txHash" id="txHash" onChange={(e) => this.handleChange(e)}/>
            <Button color="primary" onClick={(e) => this.debug(e)}>Debug Tx</Button>
            <Button color="primary" onClick={(e) => this.debugNext(e)}>Next</Button>
            <Button color="primary" onClick={(e) => this.debugPrevious(e)}>Previous</Button>
            {JSON.stringify(this.props.debuggerInfo)}
          </Grid.Col>
        </Grid.Row>
      </Page.Content>
    );
  }
}

ContractDebugger.propTypes = {
  contract: PropTypes.object.isRequired,
};

export default ContractDebugger;

