const EMBARK_PROCESS_LOGS_API_ENDPOINT = '/embark-api/process-logs/embark';
const EMBARK_PROCESS_NAME = 'embark';


class LoggerApi {
  constructor(embark) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;

    this.registerAPICalls();
  }

  registerAPICalls(){
    this.embark.registerAPICall(
      'get',
      EMBARK_PROCESS_LOGS_API_ENDPOINT,
      (req, res) => {
        let limit = parseInt(req.query.limit, 10);
        if(!Number.isInteger(limit)) limit = 0;
        res.send(this.logger.parseLogFile(limit));
      }
    );

    this.embark.registerAPICall(
      'ws',
      EMBARK_PROCESS_LOGS_API_ENDPOINT,
      (ws, req) => {
        this.events.on("log", function (logLevel, logMsg) {
          const timestamp = new Date().getTime();
          ws.send(JSON.stringify({
            msg: logMsg,
            msg_clear: logMsg.stripColors,
            name: EMBARK_PROCESS_NAME,
            logLevel: logLevel,
            timestamp
          }), () => {});
        });
      }
    );
  }
}

module.exports = LoggerApi;
