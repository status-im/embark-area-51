import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {Card, CardBody} from 'reactstrap';

import Preview from '../components/Preview';
import {getContractsByPath} from "../reducers/selectors";
import ContractDetail from '../components/ContractDetail';
import ContractLoggerContainer from '../containers/ContractLoggerContainer';
import ContractOverviewContainer from '../containers/ContractOverviewContainer';
import ContractDebuggerContainer from '../containers/ContractDebuggerContainer';

class TextEditorAsideContainer extends Component {

  render() {
    switch(this.props.currentAsideTab) {
      case 'browser':
        return <Preview />;
      case 'debugger':
        return (
          <Card>
            <CardBody>
              <h2>Debugger</h2>
              <ContractDebuggerContainer debuggerTransactionHash={this.props.debuggerTransactionHash} />
            </CardBody>
          </Card>
        );
      case 'detail':
        return this.props.contracts.map((contract, index) => {
          return (
            <Card key={'contract-' + index}>
              <CardBody>
                <h2>{contract.className} - Details</h2>
                <ContractDetail key={index} contract={contract} />
              </CardBody>
            </Card>
          );
        });
      case 'logger':
        return this.props.contracts.map((contract, index) => {
          return (
            <Card key={'contract-' + index}>
              <CardBody>
                <h2>{contract.className} - Transactions</h2>
                <ContractLoggerContainer key={index} contract={contract} />
              </CardBody>
            </Card>
          );
        });
      case 'overview':
        return this.props.contracts.map((contract, index) => {
          return (
            <Card key={'contract-' + index}>
              <CardBody>
                <h2>{contract.className} - Overview</h2>
                <ContractOverviewContainer key={index} contract={contract} />
              </CardBody>
            </Card>
          );
        });
      default:
        return <React.Fragment></React.Fragment>;
    }
  }
}

function mapStateToProps(state, props) {
  return {
    contracts: getContractsByPath(state, props.currentFile.path)
  };
}

TextEditorAsideContainer.propTypes = {
  currentFile: PropTypes.object,
  debuggerTransactionHash: PropTypes.string,
  currentAsideTab: PropTypes.string,
  contract: PropTypes.array,
  contracts: PropTypes.array
};

export default connect(
  mapStateToProps,
  {},
)(TextEditorAsideContainer);
