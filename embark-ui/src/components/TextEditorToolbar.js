import React from 'react';
import PropTypes from 'prop-types';
import {Row, FormGroup, Label, Input, Col, Button} from 'reactstrap';
import FontAwesomeIcon from 'react-fontawesome';

const TextEditorToolbar = (props) => (
  <Row>
    <Col sm={4} md={2}>
      <FormGroup check>
        <Label check>
          <Input type="checkbox" onChange={props.toggleShowHiddenFiles}/>
          Show hidden files
        </Label>
      </FormGroup>
    </Col>
    <Col sm={4} md={6}>
      <strong>{props.currentFile.name}</strong>
      <span className="mx-2">|</span>
      <Button color="success" size="sm" onClick={props.save}>
        <FontAwesomeIcon className="mr-2" name="save"/>
        Save
      </Button>
      <span className="mx-2">|</span>
      <Button color="danger" size="sm" onClick={props.remove}>
        <FontAwesomeIcon className="mr-2" name="trash"/>
        Delete
      </Button>
    </Col>
    <Col sm={4} md={4}>
      <div className="float-right mr-2">
        {props.isContract &&
          <React.Fragment>
            <Button size="sm" color="primary" onClick={() => props.openAsideTab('overview')}>
              Overview
            </Button>
            <span className="mx-2">|</span>
            <Button size="sm" color="primary" onClick={() => props.openAsideTab('functions')}>
              Functions
            </Button>
            <span className="mx-2">|</span>
            <Button size="sm" color="primary" onClick={() => props.openAsideTab('logger')}>
              Logger
            </Button>
            <span className="mx-2">|</span>
          </React.Fragment>
        }
        <Button size="sm" color="primary" onClick={() => props.openAsideTab('browser')}>
          Browser
        </Button>
      </div>
    </Col>
  </Row>
);

TextEditorToolbar.propTypes = {
  currentFile: PropTypes.object,
  isContract: PropTypes.bool,
  save: PropTypes.func,
  remove: PropTypes.func,
  toggleShowHiddenFiles: PropTypes.func,
  openAsideTab: PropTypes.func
};

export default TextEditorToolbar;
