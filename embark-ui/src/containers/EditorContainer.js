import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Row, Col} from 'reactstrap';
import TextEditorAsideContainer from './TextEditorAsideContainer';
import TextEditorContainer from './TextEditorContainer';
import FileExplorerContainer from './FileExplorerContainer';
import TextEditorToolbarContainer from './TextEditorToolbarContainer';
import {fetchEditorTabs as fetchEditorTabsAction} from '../actions';
import {getCurrentFile} from '../reducers/selectors';
import classnames from 'classnames';
import Resizable from 're-resizable';

import './EditorContainer.css';

class EditorContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {currentAsideTab: '', showHiddenFiles: false, currentFile: this.props.currentFile,
      editorHeight: '100%', editorWidth: '85%', asideHeight: '100%', asideWidth: '25%'};
  }

  componentDidMount() {
    this.props.fetchEditorTabs();
  }

  componentDidUpdate(prevProps) {
    if(this.props.currentFile.path !== prevProps.currentFile.path) {
      this.setState({currentFile: this.props.currentFile});
    }
  }

  isContract() {
    return this.state.currentFile.name && this.state.currentFile.name.endsWith('.sol');
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
    if (this.state.currentAsideTab === '') {
      console.log('REMOVE', this.state.editorWidth, this.state.asideWidth);
      this.setState({editorWidth: (parseInt(this.state.editorWidth, 10) - parseInt(this.state.asideWidth, 10)) + '%'});
    }
    if (newTab === this.state.currentAsideTab) {
      console.log('ADD', this.state.editorWidth, this.state.asideWidth);
      return this.setState({
        currentAsideTab: '',
        editorWidth: (parseInt(this.state.editorWidth, 10) + parseInt(this.state.asideWidth, 10)) + '%'
      });
    }
    this.setState({currentAsideTab: newTab});
  }

  render() {
    return (
      <Row noGutters className={classnames('h-100', 'editor--grid', {'aside-opened': this.state.currentAsideTab.length})}>
        <Col xs={12}>
          <TextEditorToolbarContainer openAsideTab={(newTab) => this.openAsideTab(newTab)}
                                      isContract={this.isContract()}
                                      currentFile={this.props.currentFile}
                                      activeTab={this.state.currentAsideTab}/>
        </Col>
        <Col className="border-right">
          <FileExplorerContainer showHiddenFiles={this.state.showHiddenFiles}
                                 toggleShowHiddenFiles={() => this.toggleShowHiddenFiles()}/>
        </Col>
        <Resizable
                   size={{ width: this.state.editorWidth, height: 'auto' }}
                   handleClasses={{left: 'resizer-handle', right: 'resizer-handle'}}
                   onResizeStop={(e, direction, ref, _d) => {
                     this.setState({
                       editorWidth: ref.style.width,
                       height: ref.style.height
                     });
                     this.editor.handleResize();
                   }}
                   className="text-editor-container"
                   enable={{ top:false, right:false, bottom:false, left:true, topRight:false, bottomRight:false, bottomLeft:false, topLeft:false }}>
          <TextEditorContainer ref={instance => {
            if (instance) this.editor = instance.getWrappedInstance().editor;
          }} currentFile={this.props.currentFile} onFileContentChange={(newContent) => this.onFileContentChange(newContent)} />
        </Resizable>
        {this.state.currentAsideTab &&
        <Resizable defaultSize={{width: '25%', height: 'auto'}}
                   handleClasses={{left: 'resizer-handle', right: 'resizer-handle'}} className="border-left-0 relative"
                   enable={{ top:false, right:false, bottom:false, left:true, topRight:false, bottomRight:false, bottomLeft:false, topLeft:false }}>
          <div className="editor-aside">
            <TextEditorAsideContainer currentAsideTab={this.state.currentAsideTab}
                                      currentFile={this.props.currentFile}/>
          </div>
        </Resizable>}
      </Row>
    );
  }
}

function mapStateToProps(state, _props) {
  const currentFile = getCurrentFile(state);

  return {
    currentFile
  };
}

EditorContainer.propTypes = {
  currentFile: PropTypes.object,
  fetchEditorTabs: PropTypes.func
};

export default connect(
  mapStateToProps,
  {fetchEditorTabs: fetchEditorTabsAction.request},
)(EditorContainer);

