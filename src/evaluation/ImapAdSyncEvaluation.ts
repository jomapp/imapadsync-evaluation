import { ImapAdSync } from '../ImapAdSync.js';
import { AdSyncEventListener, AdSyncEventType } from '../lib/AdSyncEventListener.js';
import { ImapAccount, ImapSyncState } from '../lib/ImapSyncState.js';
import { ImapError } from '../lib/imapmail/ImapError.js';
import { ImapMail } from '../lib/imapmail/ImapMail.js';
import { ImapMailbox, ImapMailboxStatus } from '../lib/imapmail/ImapMailbox.js';
import { AdSyncLogger, EvaluationConfig, LogSourceType } from '../lib/utils/AdSyncLogger.js';
import * as fs from 'fs';

class ImapAdSyncEvaluation implements AdSyncEventListener {

  private imapAdSync: ImapAdSync;
  private evaluationConfig?: EvaluationConfig;
  private adSyncLogger: AdSyncLogger;

  // TODO remove after evaluation
  private testMailCounter = 0;
  private testDownloadStartTime: Date = new Date();

  constructor() {
    this.evaluationConfig = parseEvaluationConfig();
    this.adSyncLogger = new AdSyncLogger(this.evaluationConfig.evaluationParams.step);
    this.imapAdSync = new ImapAdSync(this, this.evaluationConfig);
  }

  async runImport() {
    if (this.evaluationConfig) {
      const imapAccount: ImapAccount = {
        host: this.evaluationConfig.imapServerEvaluationConfig.host,
        port: parseInt(this.evaluationConfig.imapServerEvaluationConfig.port),
        username: this.evaluationConfig.imapServerEvaluationConfig.username,
        password: this.evaluationConfig.imapServerEvaluationConfig.password
      };
      const maxQuota = parseInt(this.evaluationConfig.imapServerEvaluationConfig.imapImportMaxQuota);
      const imapMailboxStates = [];
      const imapSyncState = new ImapSyncState(imapAccount, maxQuota, imapMailboxStates);

      await this.imapAdSync.startAdSync(imapSyncState);

      // TODO remove after evaluation
      this.testMailCounter = 0;
      this.testDownloadStartTime.setTime(Date.now());
    }
  }

  onMailbox(imapMailbox: ImapMailbox, eventType: AdSyncEventType) {
    console.log(`onMailbox ${AdSyncEventType[eventType]} event received => imapMailbox: ${imapMailbox}`);
  }

  onMailboxStatus(imapMailboxStatus: ImapMailboxStatus) {
    console.log(`onMailboxStatus event received => imapMailboxStatus: ${imapMailboxStatus}`);
  }

  onMail(imapMail: ImapMail, eventType: AdSyncEventType) {
    console.log(`onMail ${AdSyncEventType[eventType]} event received => imapMail: ${imapMail}`);
    this.testMailCounter += 1;
  }

  onPostpone(postponedUntil: Date) {
    console.log(`onPostpone event received => postponedUntil: ${postponedUntil}`);
  }

  onFinish(downloadedQuota: number) {
    console.log(`onFinish event received => downloadedQuota: ${downloadedQuota}`);

    // TODO remove after evaluation
    let downloadTime = Date.now() - this.testDownloadStartTime.getTime();
    console.log('Downloaded data (byte): ' + downloadedQuota);
    console.log('Took (ms): ' + downloadTime);
    console.log('Average throughput (bytes/ms): ' + downloadedQuota / downloadTime);
    console.log('# amount of mails downloaded: ' + this.testMailCounter);
    this.adSyncLogger.writeToLog(
      `${this.testDownloadStartTime.getTime()}, ${Date.now()}, ${downloadTime}, onAllMailboxesFinish, ${downloadedQuota}, ${
        downloadedQuota / downloadTime
      }, ${this.testMailCounter}`,
      LogSourceType.SYSTEM
    );
  }

  onError(imapError: ImapError) {
    console.log(`onError event received => imapError: ${imapError.error}`);
  }
}

function parseEvaluationConfig(): EvaluationConfig | undefined {
  const evaluation_conf_json_path = process.env.EVALUATION_CONF_PATH;

  if (evaluation_conf_json_path) {
    const jsonString = fs.readFileSync(evaluation_conf_json_path).toString();
    if (jsonString) {
      const evaluationConf: EvaluationConfig = JSON.parse(jsonString);

      const imap_host = process.env.IMAP_HOST;
      if (imap_host) {
        evaluationConf.imapServerEvaluationConfig.host = imap_host;
      }

      // convert to proper Set
      evaluationConf.adSyncConfig.emitAdSyncEventTypes = new Set<AdSyncEventType>(evaluationConf.adSyncConfig.emitAdSyncEventTypes);
      return evaluationConf;
    }
  }
  return undefined;
}

const simpleImapImporter = new ImapAdSyncEvaluation();
simpleImapImporter.runImport().then(() => {
  console.log(`imported started ...`);
});
