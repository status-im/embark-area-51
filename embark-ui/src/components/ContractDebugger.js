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

  debugJumpBack(e) {
    this.props.debugJumpBack()
  }

  debugJumpForward(e) {
    this.props.debugJumpForward()
  }

  debugStepOverForward(e) {
    this.props.debugStepOverForward()
  }

  debugStepOverBackward(e) {
    this.props.debugStepOverBackward()
  }

  debugStepIntoForward(e) {
    this.props.debugStepIntoForward()
  }

  debugStepIntoBackward(e) {
    this.props.debugStepIntoBackward()
  }

  render() {
    return (
      <Page.Content title={this.props.contract.className + ' Debugger'}>
        <Grid.Row>
          <Grid.Col>
            <Input name="txHash" id="txHash" onChange={(e) => this.handleChange(e)}/>
            <Button color="primary" onClick={(e) => this.debug(e)}>Debug Tx</Button>
          </Grid.Col>
        </Grid.Row>

        <Grid.Row>
          <Grid.Col>
            <Button color="primary" onClick={(e) => this.debugJumpBack(e)}>Back</Button>
            <Button color="primary" onClick={(e) => this.debugJumpForward(e)}>Continue</Button>
            <Button color="primary" onClick={(e) => this.debugStepOverForward(e)}>Step Back</Button>
            <Button color="primary" onClick={(e) => this.debugStepOverBackward(e)}>Step Over</Button>
            <Button color="primary" onClick={(e) => this.debugStepIntoForward(e)}>Step In</Button>
            <Button color="primary" onClick={(e) => this.debugStepIntoBackward(e)}>Step Out</Button>
          </Grid.Col>
        </Grid.Row>

        <Grid.Row>
          <Grid.Col>
            <br /><strong>Scopes</strong>
            <br /><strong>Scope -> Locals</strong>
            <br />{JSON.stringify(this.props.debuggerInfo.locals)}
            <br /><strong>Scope -> Globals</strong>
            <br />{JSON.stringify(this.props.debuggerInfo.globals)}
          </Grid.Col>
        </Grid.Row>

        <Grid.Row>
          <Grid.Col>
            <br />------------------------------
            <br />{JSON.stringify(this.props.debuggerInfo)}
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

