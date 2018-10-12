import PropTypes from "prop-types";
import React from 'react';
import { TabContent, TabPane, Nav, NavItem, NavLink, Card, CardBody, CardTitle } from 'reactstrap';
import classnames from 'classnames';

import ContractOverview from '../components/ContractOverview';
import ContractLoggerContainer from '../containers/ContractLoggerContainer';
import ContractFunctionsContainer from '../containers/ContractFunctionsContainer';
import ContractDebuggerContainer from '../containers/ContractDebuggerContainer';

class ContractLayout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeTab: '1'
    };
  }

  toggle(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab
      });
    }
  }

  render() {
    return (
      <React.Fragment>
        <Card>
          <CardBody>
            <CardTitle>{this.props.contract.className}</CardTitle>
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={classnames({ active: this.state.activeTab === '1' })}
                  onClick={() => { this.toggle('1'); }}
                >
                  Overview
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: this.state.activeTab === '2' })}
                  onClick={() => { this.toggle('2'); }}
                >
                  Functions
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: this.state.activeTab === '3' })}
                  onClick={() => { this.toggle('3'); }}
                >
                  Logger
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: this.state.activeTab === '4' })}
                  onClick={() => { this.toggle('4'); }}
                >
                  Debugger
                </NavLink>
              </NavItem>
            </Nav>
            <TabContent activeTab={this.state.activeTab}>
              <TabPane tabId="1">
                <ContractOverview contract={this.props.contract} />
              </TabPane>
              <TabPane tabId="2">
                <ContractFunctionsContainer contract={this.props.contract} />
              </TabPane>
              <TabPane tabId="3">
                <ContractLoggerContainer contract={this.props.contract} />
              </TabPane>
              <TabPane tabId="4">
                <ContractDebuggerContainer contract={this.props.contract} />
              </TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </React.Fragment>
    )
  }
}

ContractLayout.propTypes = {
  contract: PropTypes.object
};

export default ContractLayout;
