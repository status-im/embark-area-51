import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import TextEditorToolbar from '../components/TextEditorToolbar';

import {
  saveCurrentFile as saveCurrentFileAction,
  saveFile as saveFileAction,
  removeFile as removeFileAction,
} from '../actions';

class TextEditorToolbarContainer extends Component {
  save() {
    this.props.saveFile(this.props.currentFile);
    this.props.saveCurrentFile(this.props.currentFile);
  }

  remove() {
    this.props.removeFile(this.props.currentFile);
  }

  render() {
    return <TextEditorToolbar currentFile={this.props.currentFile}
                              isContract={this.props.isContract}
                              toggleShowHiddenFiles={this.props.toggleShowHiddenFiles}
                              openAsideTab={this.props.openAsideTab}
                              save={() => this.save()}
                              remove={() => this.remove()} />;
  }
}

TextEditorToolbarContainer.propTypes = {
  currentFile: PropTypes.object,
  isContract: PropTypes.bool,
  saveCurrentFile: PropTypes.func,
  saveFile: PropTypes.func,
  removeFile: PropTypes.func,
  toggleShowHiddenFiles: PropTypes.func,
  openAsideTab: PropTypes.func
};

export default connect(
  null,
  {
    saveCurrentFile: saveCurrentFileAction.request,
    saveFile: saveFileAction.request,
    removeFile: removeFileAction.request
  },
)(TextEditorToolbarContainer);
