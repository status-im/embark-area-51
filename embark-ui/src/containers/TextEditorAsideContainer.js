import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import Preview from '../components/Preview';
import {contracts as contractsAction} from '../actions';
import {getContractsByPath} from "../reducers/selectors";
import ContractDetail from '../components/ContractDetail';
import ContractLoggerContainer from '../containers/ContractLoggerContainer';
import ContractOverviewContainer from '../containers/ContractOverviewContainer';

class TextEditorAsideContainer extends Component {
  componentDidMount() {
    this.props.fetchContracts();
  }

  render() {
    switch(this.props.currentAsideTab) {
      case 'browser':
        return <Preview />
      case 'detail':
        return this.props.contracts.map((contract, index) => <ContractDetail key={index} contract={contract} />)
      case 'logger':
        return this.props.contracts.map((contract, index) => <ContractLoggerContainer key={index} contract={contract} />)
      case 'overview':
        return this.props.contracts.map((contract, index) => <ContractOverviewContainer key={index} contract={contract} />)
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
  currentAsideTab: PropTypes.string,
  contract: PropTypes.array,
  fetchContracts: PropTypes.func
};

export default connect(
  mapStateToProps,
  {
    fetchContracts: contractsAction.request,
  },
)(TextEditorAsideContainer);
