import * as actions from '../actions';
import * as api from '../api';
import {eventChannel} from 'redux-saga';
import {all, call, fork, put, takeEvery, take} from 'redux-saga/effects';

const {account, accounts, block, blocks, transaction, transactions, processes, commands, processLogs,
       contracts, contract, contractProfile, messageSend, versions, plugins, messageListen, fiddleCompile,
       fiddleDeploy, ensRecord, ensRecords, contractLogs, contractFile, contractFunction, contractDeploy,
       fiddleFile, files, gasOracle, fiddleProfile} = actions;

function *doRequest(entity, apiFn, payload) {
  const {response, error} = yield call(apiFn, payload);
  if(response) {
    yield put(entity.success(response.data, payload));
  } else if (error) {
    yield put(entity.failure(error, payload));
  }
}

export const fetchPlugins = doRequest.bind(null, plugins, api.fetchPlugins);
export const fetchVersions = doRequest.bind(null, versions, api.fetchVersions);
export const fetchAccount = doRequest.bind(null, account, api.fetchAccount);
export const fetchBlock = doRequest.bind(null, block, api.fetchBlock);
export const fetchTransaction = doRequest.bind(null, transaction, api.fetchTransaction);
export const fetchAccounts = doRequest.bind(null, accounts, api.fetchAccounts);
export const fetchBlocks = doRequest.bind(null, blocks, api.fetchBlocks);
export const fetchTransactions = doRequest.bind(null, transactions, api.fetchTransactions);
export const fetchProcesses = doRequest.bind(null, processes, api.fetchProcesses);
export const postCommand = doRequest.bind(null, commands, api.postCommand);
export const fetchProcessLogs = doRequest.bind(null, processLogs, api.fetchProcessLogs);
export const fetchContractLogs = doRequest.bind(null, contractLogs, api.fetchContractLogs);
export const fetchContracts = doRequest.bind(null, contracts, api.fetchContracts);
export const fetchContract = doRequest.bind(null, contract, api.fetchContract);
export const fetchContractProfile = doRequest.bind(null, contractProfile, api.fetchContractProfile);
export const fetchContractFile = doRequest.bind(null, contractFile, api.fetchContractFile);
export const fetchLastFiddle = doRequest.bind(null, fiddleFile, api.fetchLastFiddle);
export const postContractFunction = doRequest.bind(null, contractFunction, api.postContractFunction);
export const postContractDeploy = doRequest.bind(null, contractDeploy, api.postContractDeploy);
export const postFiddleCompile = doRequest.bind(null, fiddleCompile, api.postFiddleCompile);
export const postFiddleDeploy = doRequest.bind(null, fiddleDeploy, api.postFiddleDeploy);
export const postFiddleProfile = doRequest.bind(null, fiddleProfile, api.postFiddleProfile);
export const sendMessage = doRequest.bind(null, messageSend, api.sendMessage);
export const fetchEnsRecord = doRequest.bind(null, ensRecord, api.fetchEnsRecord);
export const postEnsRecord = doRequest.bind(null, ensRecords, api.postEnsRecord);
export const fetchFiles = doRequest.bind(null, files, api.fetchFiles);
export const fetchEthGas = doRequest.bind(null, gasOracle, api.getEthGasAPI);

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

export function *watchPostCommand() {
  yield takeEvery(actions.COMMANDS[actions.REQUEST], postCommand);
}

export function *watchFetchProcessLogs() {
  yield takeEvery(actions.PROCESS_LOGS[actions.REQUEST], fetchProcessLogs);
}

export function *watchFetchContractLogs() {
  yield takeEvery(actions.CONTRACT_LOGS[actions.REQUEST], fetchContractLogs);
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

export function *watchFetchContractFile() {
  yield takeEvery(actions.CONTRACT_FILE[actions.REQUEST], fetchContractFile);
}

export function *watchFetchLastFiddle() {
  yield takeEvery(actions.FIDDLE_FILE[actions.REQUEST], fetchLastFiddle);
}

export function *watchPostContractFunction() {
  yield takeEvery(actions.CONTRACT_FUNCTION[actions.REQUEST], postContractFunction);
}

export function *watchPostContractDeploy() {
  yield takeEvery(actions.CONTRACT_DEPLOY[actions.REQUEST], postContractDeploy);
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

export function *watchPostFiddleCompile() {
  yield takeEvery(actions.FIDDLE_COMPILE[actions.REQUEST], postFiddleCompile);
}

export function *watchFetchLastFiddleSuccess() {
  yield takeEvery(actions.FIDDLE_FILE[actions.SUCCESS], postFiddleCompile);
}

export function *watchPostFiddleDeploy() {
  yield takeEvery(actions.FIDDLE_DEPLOY[actions.REQUEST], postFiddleDeploy);
}

export function *watchPostFiddleProfile() {
  yield takeEvery(actions.FIDDLE_PROFILE[actions.REQUEST], postFiddleProfile);
}

export function *watchPostFiddleCompileSuccess() {
  yield takeEvery(actions.FIDDLE_COMPILE[actions.SUCCESS], postFiddleProfile);
}

export function *watchFetchFiles() {
  yield takeEvery(actions.FILES[actions.REQUEST], fetchFiles);
}

export function *watchFetchEthGas() {
  yield takeEvery(actions.GAS_ORACLE[actions.REQUEST], fetchEthGas);
}

function createChannel(socket) {
  return eventChannel(emit => {
    socket.onmessage = ((message) => {
      emit(JSON.parse(message.data));
    });
    return () => {
      socket.close();
    };
  });
}

export function *initBlockHeader() {
  const socket = api.webSocketBlockHeader();
  const channel = yield call(createChannel, socket);
  while (true) {
    yield take(channel);
    yield put({type: actions.BLOCKS[actions.REQUEST]});
    yield put({type: actions.TRANSACTIONS[actions.REQUEST]});
  }
}

export function *watchInitBlockHeader() {
  yield takeEvery(actions.INIT_BLOCK_HEADER, initBlockHeader);
}

export function *listenToProcessLogs(action) {
  const socket = api.webSocketProcess(action.processName);
  const channel = yield call(createChannel, socket);
  while (true) {
    const processLog = yield take(channel);
    yield put(processLogs.success([processLog]));
  }
}

export function *watchListenToProcessLogs() {
  yield takeEvery(actions.WATCH_NEW_PROCESS_LOGS, listenToProcessLogs);
}

export function *listenToContractLogs() {
  const socket = api.webSocketContractLogs();
  const channel = yield call(createChannel, socket);
  while (true) {
    const contractLog = yield take(channel);
    yield put(contractLogs.success([contractLog]));
  }
}

export function *watchListenToContractLogs() {
  yield takeEvery(actions.WATCH_NEW_CONTRACT_LOGS, listenToContractLogs);
}

export function *listenGasOracle() {
  const socket = api.websocketGasOracle();
  const channel = yield call(createChannel, socket);
  while (true) {
    const gasOracleStats = yield take(channel);
    yield put(gasOracle.success(gasOracleStats));
  }
}

export function *watchListenGasOracle() {
  yield takeEvery(actions.WATCH_GAS_ORACLE, listenGasOracle);
}

export function *listenToMessages(action) {
  const socket = api.listenToChannel(action.messageChannels[0]);
  const channel = yield call(createChannel, socket);
  while (true) {
    const message = yield take(channel);
    yield put(messageListen.success([{channel: action.messageChannels[0], message: message.data, time: message.time}]));
  }
}

export default function *root() {
  yield all([
    fork(watchInitBlockHeader),
    fork(watchFetchAccounts),
    fork(watchFetchAccount),
    fork(watchFetchProcesses),
    fork(watchFetchProcessLogs),
    fork(watchFetchContractLogs),
    fork(watchListenToProcessLogs),
    fork(watchListenToContractLogs),
    fork(watchFetchBlock),
    fork(watchFetchTransactions),
    fork(watchPostCommand),
    fork(watchFetchVersions),
    fork(watchFetchPlugins),
    fork(watchFetchBlocks),
    fork(watchFetchContracts),
    fork(watchFetchContractProfile),
    fork(watchFetchContractFile),
    fork(watchPostContractFunction),
    fork(watchPostContractDeploy),
    fork(watchListenToMessages),
    fork(watchSendMessage),
    fork(watchFetchContract),
    fork(watchFetchTransaction),
    fork(watchPostFiddleCompile),
    fork(watchPostFiddleCompileSuccess),
    fork(watchPostFiddleDeploy),
    fork(watchPostFiddleProfile),
    fork(watchFetchLastFiddle),
    fork(watchFetchLastFiddleSuccess),
    fork(watchFetchEnsRecord),
    fork(watchPostEnsRecords),
    fork(watchFetchFiles),
    fork(watchFetchEthGas),
    fork(watchListenGasOracle)
  ]);
}
