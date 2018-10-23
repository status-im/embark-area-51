import * as actions from '../actions';
import * as api from '../services/api';
import * as storage from '../services/storage';
import * as web3Service from '../services/web3';
import {eventChannel} from 'redux-saga';
import {all, call, fork, put, takeLatest, takeEvery, take, select, race} from 'redux-saga/effects';
import {getCredentials, getWeb3} from '../reducers/selectors';
import { DEPLOYMENT_PIPELINES } from '../constants';
import {searchExplorer} from './searchSaga';

function *doRequest(entity, serviceFn, payload) {
  payload.credentials = yield select(getCredentials);
  const {response, error} = yield call(serviceFn, payload);
  if(response) {
    yield put(entity.success(response.data, payload));
  } else if (error) {
    yield put(entity.failure(error.message || error));
  }
}

function *doWeb3Request(entity, serviceFn, payload) {
  payload.web3 = yield select(getWeb3);
  try {
    const result = yield call(serviceFn, payload);
    yield put(entity.success(result, payload));
  } catch (error) {
    yield put(entity.failure(error.message, payload));
  }
}

function *web3Connect(action) {
  if (action.payload !== DEPLOYMENT_PIPELINES.injectedWeb3) return;
  if (yield select(getWeb3)) return;

  try {
    const web3 = yield call(web3Service.connect);
    yield put(actions.web3Connect.success(web3));
  } catch(error) {
    yield put(actions.web3Connect.failure(error));
  }
}

export const fetchPlugins = doRequest.bind(null, actions.plugins, api.fetchPlugins);
export const fetchVersions = doRequest.bind(null, actions.versions, api.fetchVersions);
export const fetchAccount = doRequest.bind(null, actions.account, api.fetchAccount);
export const fetchBlock = doRequest.bind(null, actions.block, api.fetchBlock);
export const fetchTransaction = doRequest.bind(null, actions.transaction, api.fetchTransaction);
export const fetchAccounts = doRequest.bind(null, actions.accounts, api.fetchAccounts);
export const fetchBlocks = doRequest.bind(null, actions.blocks, api.fetchBlocks);
export const fetchTransactions = doRequest.bind(null, actions.transactions, api.fetchTransactions);
export const fetchProcesses = doRequest.bind(null, actions.processes, api.fetchProcesses);
export const fetchServices = doRequest.bind(null, actions.services, api.fetchServices);
export const postCommand = doRequest.bind(null, actions.commands, api.postCommand);
export const postCommandSuggestions = doRequest.bind(null, actions.commandSuggestions, api.postCommandSuggestions);
export const fetchProcessLogs = doRequest.bind(null, actions.processLogs, api.fetchProcessLogs);
export const fetchContractEvents = doRequest.bind(null, actions.contractEvents, api.fetchContractEvents);
export const fetchContractLogs = doRequest.bind(null, actions.contractLogs, api.fetchContractLogs);
export const fetchContracts = doRequest.bind(null, actions.contracts, api.fetchContracts);
export const fetchContract = doRequest.bind(null, actions.contract, api.fetchContract);
export const fetchContractProfile = doRequest.bind(null, actions.contractProfile, api.fetchContractProfile);
export const postContractFunction = doRequest.bind(null, actions.contractFunction, api.postContractFunction);
export const postContractDeploy = doRequest.bind(null, actions.contractDeploy, api.postContractDeploy);
export const postContractCompile = doRequest.bind(null, actions.contractCompile, api.postContractCompile);
export const sendMessage = doRequest.bind(null, actions.messageSend, api.sendMessage);
export const fetchEnsRecord = doRequest.bind(null, actions.ensRecord, api.fetchEnsRecord);
export const postEnsRecord = doRequest.bind(null, actions.ensRecords, api.postEnsRecord);
export const fetchFiles = doRequest.bind(null, actions.files, api.fetchFiles);
export const fetchFile = doRequest.bind(null, actions.file, api.fetchFile);
export const postFile = doRequest.bind(null, actions.saveFile, api.postFile);
export const deleteFile = doRequest.bind(null, actions.removeFile, api.deleteFile);
export const fetchEthGas = doRequest.bind(null, actions.gasOracle, api.getEthGasAPI);
export const authenticate = doRequest.bind(null, actions.authenticate, api.authenticate);

export const fetchCurrentFile = doRequest.bind(null, actions.currentFile, storage.fetchCurrentFile);
export const postCurrentFile = doRequest.bind(null, actions.saveCurrentFile, storage.postCurrentFile);
export const deleteCurrentFile = doRequest.bind(null, null, storage.deleteCurrentFile);
export const fetchCredentials = doRequest.bind(null, actions.fetchCredentials, storage.fetchCredentials);
export const saveCredentials = doRequest.bind(null, actions.saveCredentials, storage.saveCredentials);
export const logout = doRequest.bind(null, actions.logout, storage.logout);
export const changeTheme = doRequest.bind(null, actions.changeTheme, storage.changeTheme);
export const fetchTheme = doRequest.bind(null, actions.fetchTheme, storage.fetchTheme);
export const signMessage = doRequest.bind(null, actions.signMessage, api.signMessage);
export const verifyMessage = doRequest.bind(null, actions.verifyMessage, api.verifyMessage);

export const explorerSearch = searchExplorer.bind(null, actions.explorerSearch);

export const web3Deploy = doWeb3Request.bind(null, actions.web3Deploy, web3Service.deploy);
export const web3EstimateGas = doWeb3Request.bind(null, actions.web3EstimateGas, web3Service.estimateGas);


export function *watchFetchTransaction() {
  yield takeEvery(actions.TRANSACTION[actions.REQUEST], fetchTransaction);
}

export function *watchFetchTransactions() {
  yield takeEvery(actions.TRANSACTIONS[actions.REQUEST], fetchTransactions);
}

export function *watchFetchBlock() {
  yield takeEvery(actions.BLOCK[actions.REQUEST], fetchBlock);
}

export function *watchFetchBlocks() {
  yield takeEvery(actions.BLOCKS[actions.REQUEST], fetchBlocks);
}

export function *watchFetchAccount() {
  yield takeEvery(actions.ACCOUNT[actions.REQUEST], fetchAccount);
}

export function *watchFetchAccounts() {
  yield takeEvery(actions.ACCOUNTS[actions.REQUEST], fetchAccounts);
}

export function *watchFetchProcesses() {
  yield takeEvery(actions.PROCESSES[actions.REQUEST], fetchProcesses);
}

export function *watchFetchServices() {
  yield takeLatest(actions.PROCESSES[actions.REQUEST], fetchServices);
}

export function *watchPostCommand() {
  yield takeEvery(actions.COMMANDS[actions.REQUEST], postCommand);
}

export function *watchPostCommandSuggestions() {
  yield takeLatest(actions.COMMAND_SUGGESTIONS[actions.REQUEST], postCommandSuggestions);
}

export function *watchFetchProcessLogs() {
  yield takeEvery(actions.PROCESS_LOGS[actions.REQUEST], fetchProcessLogs);
}

export function *watchFetchContractLogs() {
  yield takeEvery(actions.CONTRACT_LOGS[actions.REQUEST], fetchContractLogs);
}

export function *watchFetchContractEvents() {
  yield takeEvery(actions.CONTRACT_EVENTS[actions.REQUEST], fetchContractEvents);
}

export function *watchFetchContract() {
  yield takeEvery(actions.CONTRACT[actions.REQUEST], fetchContract);
}

export function *watchFetchContracts() {
  yield takeEvery(actions.CONTRACTS[actions.REQUEST], fetchContracts);
}

export function *watchFetchContractProfile() {
  yield takeEvery(actions.CONTRACT_PROFILE[actions.REQUEST], fetchContractProfile);
}

export function *watchPostContractFunction() {
  yield takeEvery(actions.CONTRACT_FUNCTION[actions.REQUEST], postContractFunction);
}

export function *watchPostContractDeploy() {
  yield takeEvery(actions.CONTRACT_DEPLOY[actions.REQUEST], postContractDeploy);
}

export function *watchPostContractCompile() {
  yield takeEvery(actions.CONTRACT_COMPILE[actions.REQUEST], postContractCompile);
}

export function *watchFetchVersions() {
  yield takeEvery(actions.VERSIONS[actions.REQUEST], fetchVersions);
}

export function *watchFetchPlugins() {
  yield takeEvery(actions.PLUGINS[actions.REQUEST], fetchPlugins);
}

export function *watchSendMessage() {
  yield takeEvery(actions.MESSAGE_SEND[actions.REQUEST], sendMessage);
}

export function *watchFetchEnsRecord() {
  yield takeEvery(actions.ENS_RECORD[actions.REQUEST], fetchEnsRecord);
}

export function *watchPostEnsRecords() {
  yield takeEvery(actions.ENS_RECORDS[actions.REQUEST], postEnsRecord);
}

export function *watchListenToMessages() {
  yield takeEvery(actions.MESSAGE_LISTEN[actions.REQUEST], listenToMessages);
}

export function *watchFetchFiles() {
  yield takeEvery(actions.FILES[actions.REQUEST], fetchFiles);
}

export function *watchFetchFile() {
  yield takeEvery(actions.FILE[actions.REQUEST], fetchFile);
}

export function *watchPostFile() {
  yield takeEvery(actions.SAVE_FILE[actions.REQUEST], postFile);
}

export function *watchPostFileSuccess() {
  yield takeEvery(actions.SAVE_FILE[actions.SUCCESS], postCurrentFile);
}

export function *watchDeleteFile() {
  yield takeEvery(actions.REMOVE_FILE[actions.REQUEST], deleteFile);
}

export function *watchDeleteFileSuccess() {
  yield takeEvery(actions.REMOVE_FILE[actions.SUCCESS], fetchFiles);
  yield takeEvery(actions.REMOVE_FILE[actions.SUCCESS], deleteCurrentFile);
}

export function *watchFetchFileSuccess() {
  yield takeEvery(actions.FILE[actions.SUCCESS], postCurrentFile);
}

export function *watchFetchCurrentFile() {
  yield takeEvery(actions.CURRENT_FILE[actions.REQUEST], fetchCurrentFile);
}

export function *watchFetchEthGas() {
  yield takeEvery(actions.GAS_ORACLE[actions.REQUEST], fetchEthGas);
}

export function *watchAuthenticate() {
  yield takeEvery(actions.AUTHENTICATE[actions.REQUEST], authenticate);
}

export function *watchChangeTheme() {
  yield takeEvery(actions.CHANGE_THEME[actions.REQUEST], changeTheme);
}

export function *watchFetchTheme() {
  yield takeEvery(actions.FETCH_THEME[actions.REQUEST], fetchTheme);
}

export function *watchAuthenticateSuccess() {
  yield takeEvery(actions.AUTHENTICATE[actions.SUCCESS], saveCredentials);
}

export function *watchFetchCredentials() {
  yield takeEvery(actions.FETCH_CREDENTIALS[actions.REQUEST], fetchCredentials);
}

export function *watchLogout() {
  yield takeEvery(actions.LOGOUT[actions.REQUEST], logout);
}

export function *watchExplorerSearch() {
  yield takeEvery(actions.EXPLORER_SEARCH[actions.REQUEST], explorerSearch);
}

export function *watchSignMessage() {
  yield takeEvery(actions.SIGN_MESSAGE[actions.REQUEST], signMessage);
}

export function *watchVerifyMessage() {
  yield takeEvery(actions.VERIFY_MESSAGE[actions.REQUEST], verifyMessage);
}

export function *watchWeb3Deploy() {
  yield takeEvery(actions.WEB3_DEPLOY[actions.REQUEST], web3Deploy);
}

export function *watchWeb3EstimateGas() {
  yield takeEvery(actions.WEB3_ESTIMAGE_GAS[actions.REQUEST], web3EstimateGas);
}

export function *watchUpdateDeploymentPipeline() {
  yield takeEvery(actions.UPDATE_DEPLOYMENT_PIPELINE, web3Connect);
}

function createChannel(socket) {
  return eventChannel(emit => {
    socket.onmessage = ((message) => {
      try {
        emit(JSON.parse(message.data));
      } catch(_error) {
        // Ignore the message if not formatted correctly
        // For example message like outputDone (for live reload)
      }
    });
    return () => {
      socket.close();
    };
  });
}

export function *initBlockHeader() {
  const credentials = yield select(getCredentials);
  const socket = api.webSocketBlockHeader(credentials);
  const channel = yield call(createChannel, socket);
  while (true) {
    const { cancel } = yield race({
      task: take(channel),
      cancel: take(actions.STOP_BLOCK_HEADER)
    });

    if (cancel) {
      channel.close();
      return;
    }
    yield put({type: actions.BLOCKS[actions.REQUEST]});
    yield put({type: actions.TRANSACTIONS[actions.REQUEST]});
  }
}

export function *watchInitBlockHeader() {
  yield takeEvery(actions.INIT_BLOCK_HEADER, initBlockHeader);
}

export function *listenToProcessLogs(action) {
  const credentials = yield select(getCredentials);
  const socket = api.webSocketProcess(credentials, action.processName);
  const channel = yield call(createChannel, socket);
  while (true) {
    const { cancel, processLog } = yield race({
      processLog: take(channel),
      cancel: take(actions.STOP_NEW_PROCESS_LOGS)
    });

    if (cancel && action.processName === cancel.processName) {
      channel.close();
      return;
    }

    yield put(actions.processLogs.success([processLog]));
  }
}

export function *watchListenToProcessLogs() {
  yield takeEvery(actions.WATCH_NEW_PROCESS_LOGS, listenToProcessLogs);
}

export function *listenToContractLogs() {
  const credentials = yield select(getCredentials);
  const socket = api.webSocketContractLogs(credentials);
  const channel = yield call(createChannel, socket);
  while (true) {
    const contractLog = yield take(channel);
    yield put(actions.contractLogs.success([contractLog]));
  }
}

export function *watchListenToContractLogs() {
  yield takeEvery(actions.WATCH_NEW_CONTRACT_LOGS, listenToContractLogs);
}

export function *listenToContractEvents() {
  const credentials = yield select(getCredentials);
  const socket = api.webSocketContractEvents(credentials);
  const channel = yield call(createChannel, socket);
  while (true) {
    const contractEvent = yield take(channel);
    yield put(actions.contractEvents.success([contractEvent]));
  }
}

export function *watchListenToContractEvents() {
  yield takeEvery(actions.WATCH_NEW_CONTRACT_EVENTS, listenToContractEvents);
}

export function *listenGasOracle() {
  const credentials = yield select(getCredentials);
  const socket = api.websocketGasOracle(credentials);
  const channel = yield call(createChannel, socket);
  while (true) {
    const { cancel, gasOracleStats } = yield race({
      gasOracleStats: take(channel),
      cancel: take(actions.STOP_GAS_ORACLE)
    });

    if (cancel) {
      channel.close();
      return;
    }
    yield put(actions.gasOracle.success(gasOracleStats));
  }
}

export function *watchListenGasOracle() {
  yield takeEvery(actions.WATCH_GAS_ORACLE, listenGasOracle);
}

export function *listenToMessages(action) {
  const credentials = yield select(getCredentials);
  const socket = api.listenToChannel(credentials, action.messageChannels[0]);
  const channel = yield call(createChannel, socket);
  while (true) {
    const message = yield take(channel);
    yield put(actions.messageListen.success([{channel: action.messageChannels[0], message: message.data, time: message.time}]));
  }
}

export default function *root() {
  yield all([
    fork(watchInitBlockHeader),
    fork(watchFetchAccounts),
    fork(watchFetchAccount),
    fork(watchFetchProcesses),
    fork(watchFetchServices),
    fork(watchFetchProcessLogs),
    fork(watchFetchContractLogs),
    fork(watchFetchContractEvents),
    fork(watchListenToProcessLogs),
    fork(watchListenToContractLogs),
    fork(watchListenToContractEvents),
    fork(watchFetchBlock),
    fork(watchFetchTransactions),
    fork(watchPostCommand),
    fork(watchPostCommandSuggestions),
    fork(watchFetchVersions),
    fork(watchFetchPlugins),
    fork(watchFetchBlocks),
    fork(watchFetchContracts),
    fork(watchFetchContractProfile),
    fork(watchPostContractFunction),
    fork(watchPostContractDeploy),
    fork(watchPostContractCompile),
    fork(watchListenToMessages),
    fork(watchSendMessage),
    fork(watchFetchContract),
    fork(watchFetchTransaction),
    fork(watchFetchEnsRecord),
    fork(watchPostEnsRecords),
    fork(watchFetchFiles),
    fork(watchFetchFile),
    fork(watchPostFile),
    fork(watchDeleteFile),
    fork(watchDeleteFileSuccess),
    fork(watchFetchFileSuccess),
    fork(watchFetchCurrentFile),
    fork(watchPostFileSuccess),
    fork(watchFetchCredentials),
    fork(watchFetchEthGas),
    fork(watchAuthenticate),
    fork(watchAuthenticateSuccess),
    fork(watchLogout),
    fork(watchExplorerSearch),
    fork(watchFetchTheme),
    fork(watchChangeTheme),
    fork(watchListenGasOracle),
    fork(watchSignMessage),
    fork(watchVerifyMessage),
    fork(watchWeb3EstimateGas),
    fork(watchWeb3Deploy),
    fork(watchUpdateDeploymentPipeline)
  ]);
}
