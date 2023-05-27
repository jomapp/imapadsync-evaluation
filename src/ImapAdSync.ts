import { AdSyncEventListener, AdSyncEventType } from './lib/AdSyncEventListener.js';
import { ImapSyncSession } from './lib/ImapSyncSession.js';
import { ImapSyncState } from './lib/ImapSyncState.js';
import { AdSyncLogger, EvaluationConfig, LogSourceType } from './lib/utils/AdSyncLogger.js';

const defaultAdSyncConfig: AdSyncConfig = {
  isEnableParallelProcessesOptimizer: true,
  parallelProcessesOptimizationDifference: 2,
  processesTimeToLive: 15,
  isEnableDownloadBatchSizeOptimizer: true,
  downloadBatchSizeOptimizationDifference: 100,
  defaultDownloadBatchSize: 500,
  optimizationInterval: 10,
  emitAdSyncEventTypes: new Set<AdSyncEventType>([AdSyncEventType.CREATE, AdSyncEventType.UPDATE, AdSyncEventType.DELETE]),
  isEnableImapQresync: true
};

export interface AdSyncConfig {
  isEnableParallelProcessesOptimizer: boolean;
  parallelProcessesOptimizationDifference: number;
  processesTimeToLive: number;
  isEnableDownloadBatchSizeOptimizer: boolean;
  downloadBatchSizeOptimizationDifference: number;
  defaultDownloadBatchSize: number;
  optimizationInterval: number;
  emitAdSyncEventTypes: Set<AdSyncEventType>;
  isEnableImapQresync: boolean;
}

export class ImapAdSync {
  private syncSession: ImapSyncSession;
  adSyncLogger: AdSyncLogger;

  constructor(adSyncEventListener: AdSyncEventListener, evaluationConfig?: EvaluationConfig) {
    this.adSyncLogger = new AdSyncLogger(evaluationConfig?.evaluationParams.step);

    this.syncSession = new ImapSyncSession(adSyncEventListener, evaluationConfig?.adSyncConfig ?? defaultAdSyncConfig, this.adSyncLogger);

    this.adSyncLogger.initializeLogFile(LogSourceType.SINGLE_PROCESSES_OPTIMIZER);
    this.adSyncLogger.initializeLogFile(LogSourceType.PARALLEL_PROCESSES_OPTIMIZER);
    this.adSyncLogger.initializeLogFile(LogSourceType.DOWNLOAD_BATCH_SIZE_OPTIMIZER);
    this.adSyncLogger.initializeLogFile(LogSourceType.MAIL_DOWNLOAD);
    this.adSyncLogger.initializeLogFile(LogSourceType.MAIL_ENCRYPTION);
    this.adSyncLogger.initializeLogFile(LogSourceType.MAIL_UPLOAD);
    this.adSyncLogger.initializeLogFile(LogSourceType.GLOBAL);
    this.adSyncLogger.initializeLogFile(LogSourceType.SYSTEM);
  }

  async startAdSync(imapSyncState: ImapSyncState): Promise<void> {
    return this.syncSession.startSyncSession(imapSyncState);
  }

  async stopAdSync(): Promise<void> {
    return this.syncSession.stopSyncSession();
  }
}
