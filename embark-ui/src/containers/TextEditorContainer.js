import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import TextEditor from '../components/TextEditor';
import {
  toggleBreakpoint,
} from '../actions';
import {getBreakpointsByFilename} from '../reducers/selectors';

const TextEditorContainer = (props) => (
  <TextEditor file={props.currentFile}
              breakpoints={props.breakpoints}
              toggleBreakpoint={props.toggleBreakpoint}
              onFileContentChange={props.onFileContentChange} />
)

function mapStateToProps(state, props) {
  const breakpoints = getBreakpointsByFilename(state, props.currentFile.name);
  return {breakpoints};
}

TextEditorContainer.propTypes = {
  currentFile: PropTypes.object,
  onFileContentChange: PropTypes.func,
  toggleBreakpoints: PropTypes.func,
  breakpoints: PropTypes.array,
};

export default connect(
  mapStateToProps,
  {toggleBreakpoint},
)(TextEditorContainer);
