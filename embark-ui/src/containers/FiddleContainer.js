/* eslint multiline-ternary: "off" */
/* eslint operator-linebreak: "off" */
import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {
  fiddleCompile,
  fiddleDeploy,
  fiddleFile
} from '../actions';
import Fiddle from '../components/Fiddle';
import FiddleResults from '../components/FiddleResults';
import FiddleResultsSummary from '../components/FiddleResultsSummary';
import scrollToComponent from 'react-scroll-to-component';
import {getFiddleCompile, getFiddleDeploy, getFiddleProfile} from "../reducers/selectors";
import CompilerError from "../components/CompilerError";
import {List, Badge, Button} from 'tabler-react';
import {NavLink} from 'react-router-dom';
import LoadingCardWithIcon from '../components/LoadingCardWithIcon';
import {hashCode} from '../utils/utils';
import ContractFunctions from '../components/ContractFunctions';

class FiddleContainer extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: undefined,
      loadingMessage: 'Loading...',
      readOnly: true
    };
    this.compileTimeout = null;
    this.ace = null;
    this.editor = null;
    this.warningsCardRef = null;
    this.errorsCardRef = null;
    this.fatalCardRef = null;
    this.deployedCardRef = null;
    this.fiddleResultsRef = React.createRef();
  }

  componentDidMount() {
    this.setState({loadingMessage: 'Loading saved state...'});
    this.props.fetchLastFiddle(Date.now());
  }

  componentDidUpdate(prevProps) {
    const {lastFiddle} = this.props;
    if (this.state.value === '' && prevProps.lastFiddle === lastFiddle) return;
    if ((!this.state.value && lastFiddle && !lastFiddle.error) && this.state.value !== lastFiddle) {
      this._onCodeChange(lastFiddle, true);
    }
  }

  _getRowCol(errorMessage) {
    const errorSplit = errorMessage.split(':');
    if (errorSplit.length >= 3) {
      return {row: errorSplit[1], col: errorSplit[2]};
    }
    return {row: 0, col: 0};
  }

  _onCodeChange(newValue, immediate = false) {
    this.setState({readOnly: false, value: newValue});
    if (this.compileTimeout) clearTimeout(this.compileTimeout);
    this.compileTimeout = setTimeout(() => {
      this.setState({loadingMessage: 'Compiling...'});
      this.props.postFiddleCompile(newValue, Date.now());
    }, immediate ? 0 : 1000);
  }

  _onErrorClick(e, annotation) {
    e.preventDefault();
    this.editor.gotoLine(annotation.row + 1);
    scrollToComponent(this.ace);
  }

  _onErrorSummaryClick(e, ref) {
    scrollToComponent(ref);
  }

  _onDeployClick(_e) {
    this.setState({loadingMessage: 'Deploying...'});
    this.props.postFiddleDeploy(this.props.compiledFiddle.compilationResult);
    scrollToComponent(this.deployedCardRef || this.fiddleResultsRef.current); // deployedCardRef null on first Deploy click
  }

  _renderErrors(errors, errorType) {
    return errors.reduce(
      (errors, error, index) => {
        if (error.severity === errorType) {
          const errorRowCol = this._getRowCol(error.formattedMessage);
          const annotation = Object.assign({}, {
            row: errorRowCol.row - 1, // must be 0 based
            column: errorRowCol.col - 1,  // must be 0 based
            text: error.formattedMessage,  // text to show in tooltip
            type: error.severity // "error"|"warning"|"info"
          });
          errors.push({
            solcError: error,
            node:
              <CompilerError
                onClick={(e) => { this._onErrorClick(e, annotation); }}
                key={`${errorType}_${index}`}
                index={index}
                errorType={errorType}
                row={errorRowCol.row}
                errorMessage={error.formattedMessage} />,
            annotation: annotation
          });
        }
        return errors;
      }, []);
  }

  _renderErrorsCard(errors, errorType) {
    const color = (errorType === "error" ? "danger" : errorType);

    return (Boolean(errors.length) && <LoadingCardWithIcon
      anchorId={errorType + "s"}
      color={color}
      className={errorType + "s-card "}
      key={errorType + "s-card"}
      showCardOptions={true}
      isLoading={this.props.loading}
      cardOptionsClassName={errorType + "s"}
      body={
        <List.Group>
          {errors.map(error => { return error.node; })}
        </List.Group>
      }
      headerTitle={
        <React.Fragment>
          <span className="mr-1">{errorType + "s"}</span><Badge color={color}>{errors.length}</Badge>
        </React.Fragment>
      }
      ref={cardRef => { this[errorType + "sCardRef"] = cardRef; }}
    />);
  }

  _renderSuccessCard(title, body) {
    return this._renderLoadingCard("success", "success-card", "check", title, body, (cardRef) => {
      this.deployedCardRef = cardRef;
    });
  }

  _renderFatalCard(title, body) {
    return body && this._renderLoadingCard("danger", "fatal-card", "slash", title, body, (cardRef) => {
      this.fatalCardRef = cardRef;
    });
  }

  _renderLoadingCard(color, className, iconName, headerTitle, body, refCb) {
    return (<LoadingCardWithIcon
      color={color}
      className={className}
      iconName={iconName}
      showCardOptions={false}
      isLoading={this.props.loading}
      body={body}
      headerTitle={headerTitle}
      key={hashCode([className, iconName, headerTitle].join(''))}
      ref={refCb}
    />);
  }

  render() {
    const {
      compiledFiddle, 
      profiledFiddle, 
      loading, 
      fiddleCompileError, 
      fiddleDeployError, 
      deployedFiddle, 
      fatalError
    } = this.props;
    const {loadingMessage, value, readOnly} = this.state;
    let warnings = [];
    let errors = [];
    if (compiledFiddle && compiledFiddle.errors) {
      warnings = this._renderErrors(compiledFiddle.errors, "warning");
      errors = this._renderErrors(compiledFiddle.errors, "error");
    }
    const hasResult = Boolean(compiledFiddle);
    return (
      <React.Fragment>
        <h1 className="page-title">Fiddle</h1>
        <p>Play around with contract code and deploy against your running node.</p>
        <FiddleResultsSummary
          numErrors={errors.length}
          numWarnings={warnings.length}
          isLoading={loading}
          loadingMessage={loadingMessage}
          showFatalError={Boolean(fatalError)}
          showFatalFiddle={Boolean(fiddleCompileError)}
          showFatalFiddleDeploy={Boolean(fiddleDeployError)}
          onDeployClick={(e) => this._onDeployClick(e)}
          isVisible={Boolean(fatalError || hasResult || loading)}
          showDeploy={hasResult && Boolean(compiledFiddle.compilationResult)}
          onWarningsClick={(e) => this._onErrorSummaryClick(e, this.errorsCardRef)}
          onErrorsClick={(e) => this._onErrorSummaryClick(e, this.warningsCardRef)}
          onFatalClick={(e) => this._onErrorSummaryClick(e, this.fatalCardRef)}
        />
        <Fiddle
          value={value}
          readOnly={readOnly}
          onCodeChange={(n) => this._onCodeChange(n)}
          errors={errors}
          warnings={warnings}
          ref={(fiddle) => {
            if (fiddle) {
              this.editor = fiddle.ace.editor;
              this.ace = fiddle.ace;
            }
          }}
        />
        <FiddleResults
          key="results"
          errorsCard={this._renderErrorsCard(errors, "error")}
          warningsCard={this._renderErrorsCard(warnings, "warning")}
          fatalErrorCard={this._renderFatalCard("Fatal error", fatalError)}
          fatalFiddleCard={this._renderFatalCard("Failed to compile", fiddleCompileError)}
          fatalFiddleDeployCard={this._renderFatalCard("Failed to deploy", fiddleDeployError)}
          compiledContractsCard={compiledFiddle && compiledFiddle.compilationResult && this._renderSuccessCard("Contract(s) compiled!",
            profiledFiddle && <ContractFunctions contractProfile={profiledFiddle}
                                contractFunctions={deployedFiddle}
                                onlyConstructor
                                postContractFunction={this._onDeployClick}/>
          )}
          deployedContractsCard={deployedFiddle && this._renderSuccessCard("Contract(s) deployed!",
            <Button
              to={`/embark/contracts/${deployedFiddle}/overview`}
              RootComponent={NavLink}
            >Play with my contract(s)</Button>
          )}
          forwardedRef={this.fiddleResultsRef}
        />
      </React.Fragment>
    );
  }
}
function mapStateToProps(state) {
  const compiledFiddle = getFiddleCompile(state);
  const deployedFiddle = getFiddleDeploy(state);
  const profiledFiddle = getFiddleProfile(state);
  return {
    compiledFiddle: compiledFiddle.data,
    deployedFiddle: deployedFiddle.data,
    profiledFiddle: profiledFiddle.data ? profiledFiddle.data.fiddleProfile : undefined,
    fiddleCompileError: compiledFiddle.error,
    fiddleDeployError: deployedFiddle.error,
    fiddleProfileError: profiledFiddle.error,
    loading: state.loading,
    lastFiddle: compiledFiddle.data ? compiledFiddle.data.codeToCompile : undefined,
    fatalError: state.errorMessage
  };
}

FiddleContainer.propTypes = {
  compiledFiddle: PropTypes.object,
  fiddleCompileError: PropTypes.string,
  fiddleDeployError: PropTypes.string,
  fiddleProfileError: PropTypes.string,
  loading: PropTypes.bool,
  postFiddleCompile: PropTypes.func,
  postFiddleDeploy: PropTypes.func,
  deployedFiddle: PropTypes.string,
  profiledFiddle: PropTypes.object,
  fetchLastFiddle: PropTypes.func,
  lastFiddle: PropTypes.any,
  fatalError: PropTypes.string
};

export default connect(
  mapStateToProps,
  {
    postFiddleCompile: fiddleCompile.post,
    postFiddleDeploy: fiddleDeploy.post,
    fetchLastFiddle: fiddleFile.request
  },
)(FiddleContainer);
