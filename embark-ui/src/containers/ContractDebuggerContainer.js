import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {contractLogs as contractLogsAction, listenToContractLogs, startDebug, debugNext, debugPrevious} from '../actions';

import ContractDebugger from '../components/ContractDebugger';
import DataWrapper from "../components/DataWrapper";
import {getContractLogsByContract, debuggerInfo} from "../reducers/selectors";

class ContractDebuggerContainer extends Component {
  componentDidMount() {
    // if (this.props.contractLogs.length === 0) {
    //   this.props.listenToContractLogs();
    //   this.props.fetchContractLogs(this.props.contract.className);
    // }
  }

  render() {
    return (
      <DataWrapper shouldRender={this.props.contractLogs !== undefined } {...this.props} render={() => (
        <ContractDebugger contract={this.props.contract} startDebug={this.props.startDebug} debugNext={this.props.debugNext} debugPrevious={this.props.debugPrevious} debuggerInfo={this.props.debuggerInfo}  />
      )} />
    );
  }
}

function mapStateToProps(state, props) {
  return {
    contractLogs: getContractLogsByContract(state, props.contract.className),
    debuggerInfo: debuggerInfo(state)
  };
}

ContractDebuggerContainer.propTypes = {
  contractLogs: PropTypes.array,
  fetchContractLogs: PropTypes.func,
  listenToContractLogs: PropTypes.func,
  match: PropTypes.object
};

export default connect(
  mapStateToProps,
  {
    startDebug: startDebug.request,
    debugNext: debugNext.request,
    debugPrevious: debugPrevious.request
  }
)(ContractDebuggerContainer);

