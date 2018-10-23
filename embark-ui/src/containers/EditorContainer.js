import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Row, Col} from 'reactstrap';
import TextEditorAsideContainer from './TextEditorAsideContainer';
import TextEditorContainer from './TextEditorContainer';
import FileExplorerContainer from './FileExplorerContainer';
import TextEditorToolbarContainer from './TextEditorToolbarContainer';
import {currentFile as currentFileAction} from '../actions';
import {getCurrentFile} from '../reducers/selectors';

import './EditorContainer.css';

const DEFAULT_FILE = {name: 'newContract.sol', content: ''};

class EditorContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {currentAsideTab: '', showHiddenFiles: false, currentFile: this.props.currentFile}
  }

  componentDidMount() {
    if(this.props.currentFile.content === '') {
      this.props.fetchCurrentFile();
    }
  }

  componentDidUpdate(prevProps) {
    if(this.props.currentFile.path !== prevProps.currentFile.path) {
      this.setState({currentFile: this.props.currentFile});
    }
  }

  isContract() {
    return this.state.currentFile.name.endsWith('.sol');
  }

  onFileContentChange(newContent) {
    const newCurrentFile = this.state.currentFile;
    newCurrentFile.content = newContent;
    this.setState({currentFile: newCurrentFile});
  }

  toggleShowHiddenFiles() {
    this.setState({showHiddenFiles: !this.state.showHiddenFiles});
  }

  openAsideTab(newTab) {
    if (newTab === this.state.currentAsideTab) {
      return this.setState({currentAsideTab: ''})
    }
    this.setState({currentAsideTab: newTab})
  }

  textEditorMdSize() {
    return this.state.currentAsideTab.length ? 5 : 10
  }

  textEditorXsSize() {
    return this.state.currentAsideTab.length ? 2 : 8
  }

  render() {
    return (
      <Row noGutters className="h-100 editor--grid">
        <Col xs={12}>
          <TextEditorToolbarContainer toggleShowHiddenFiles={() => this.toggleShowHiddenFiles()} 
                                      openAsideTab={(newTab) => this.openAsideTab(newTab)}
                                      isContract={this.isContract()}
                                      currentFile={this.props.currentFile} />
        </Col>
        <Col xs={4} md={2}>
          <FileExplorerContainer showHiddenFiles={this.state.showHiddenFiles} />
        </Col>
        <Col xs={this.textEditorXsSize()} md={this.textEditorMdSize()}>
          <TextEditorContainer currentFile={this.props.currentFile} onFileContentChange={(newContent)=> this.onFileContentChange(newContent)} />
        </Col>
        {this.state.currentAsideTab && <Col xs={6} md={5}>
          <TextEditorAsideContainer currentAsideTab={this.state.currentAsideTab} currentFile={this.props.currentFile} />
        </Col>}
      </Row>
    );
  }
}

function mapStateToProps(state, props) {
  const currentFile = getCurrentFile(state) || DEFAULT_FILE;

  return {
    currentFile
  };
}

EditorContainer.propTypes = {
  currentFile: PropTypes.object,
  fetchCurrentFile: PropTypes.func
};

export default connect(
  mapStateToProps,
  {fetchCurrentFile: currentFileAction.request},
)(EditorContainer);

