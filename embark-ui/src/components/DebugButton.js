import React from 'react';
import PropTypes from 'prop-types';
import {Button} from "reactstrap";
import FontAwesome from 'react-fontawesome';
import {withRouter} from "react-router-dom";

class DebugButton extends React.Component {
  onClick() {
    this.props.history.push(`/embark/editor?debuggerTransactionHash=${this.props.transactionHash}`);
  }

  render() {
    return (
      <Button color="primary" onClick={() => this.onClick()}>
        <FontAwesome className="mr-2" name="bug"/>
        Debug
      </Button>
    );
  }
}

DebugButton.propTypes = {
  transactionHash: PropTypes.string
};

export default withRouter(DebugButton);