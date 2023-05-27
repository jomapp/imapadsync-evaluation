import { AdSyncConfig } from '../../ImapAdSync.js';

export enum LogSourceType {
  SINGLE_PROCESSES_OPTIMIZER,
  PARALLEL_PROCESSES_OPTIMIZER,
  DOWNLOAD_BATCH_SIZE_OPTIMIZER,
  MAIL_DOWNLOAD,
  MAIL_ENCRYPTION,
  MAIL_UPLOAD,
  GLOBAL,
  SYSTEM,
}

export interface EvaluationParams {
  step: number;
}

export interface ImapServerEvaluationConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  imapImportMaxQuota: string;
}

export interface EvaluationConfig {
  evaluationParams: EvaluationParams;
  adSyncConfig: AdSyncConfig;
  imapServerEvaluationConfig: ImapServerEvaluationConfig;
}

const fs = require('node:fs');

export class AdSyncLogger {
  private evaluationStep: number;

  constructor(evaluationStep: number = 0) {
    this.evaluationStep = evaluationStep;
  }

  async initializeLogFile(logSourceType: LogSourceType) {
    let filepath = '';
    let logText = '';

    switch (logSourceType) {
      case LogSourceType.SINGLE_PROCESSES_OPTIMIZER:
        filepath = `./outputs/STEP_${this.evaluationStep}_single_processes_optimizer.csv`;
        logText = 'currentInterval fromTimeStamp, currentInterval toTimeStamp, combinedAverageThroughputCurrent, UpdateAction\n';
        break;

      case LogSourceType.PARALLEL_PROCESSES_OPTIMIZER:
        filepath = `./outputs/STEP_${this.evaluationStep}_parallel_processes_optimizer.csv`;
        logText =
          'currentInterval fromTimeStamp, currentInterval toTimeStamp, combinedAverageThroughputCurrent, UpdateAction, maxParallelProcesses, runningProcessMap Size, runningProcessMap MailboxPaths\n';
        break;

      case LogSourceType.DOWNLOAD_BATCH_SIZE_OPTIMIZER:
        filepath = `./outputs/STEP_${this.evaluationStep}_download_batch_size_optimizer.csv`;
        logText =
          'currentInterval fromTimeStamp, currentInterval toTimeStamp, averageThroughputCurrent, downloadBatchSizeCurrent, downloadBatchSizeDidIncrease, mailboxPath\n';
        break;

      case LogSourceType.MAIL_DOWNLOAD:
        filepath = `./outputs/STEP_${this.evaluationStep}_mail_download.csv`;
        logText = 'mailDownloadStartTime, mailDownloadEndTime, mailDownloadTime, currenThroughput, mailSize, imapUid, mailboxPath, processId\n';
        break;

      case LogSourceType.MAIL_ENCRYPTION:
        filepath = `./outputs/STEP_${this.evaluationStep}_mail_encryption.csv`;
        logText = 'encryptionStartTime, encryptionEndTime, encryptionTime, currenThroughput, mailSize, imapUid, mailboxPath\n';
        break;

      case LogSourceType.MAIL_UPLOAD:
        filepath = `./outputs/STEP_${this.evaluationStep}_mail_upload.csv`;
        logText = 'mailUploadStartTime, mailUploadEndTime, mailUploadTime, currenThroughput, mailSize, imapUid, mailboxPath\n';
        break;

      case LogSourceType.GLOBAL:
        filepath = `./outputs/STEP_${this.evaluationStep}_global.csv`;
        logText = 'timeStamp, event, processId, mailboxPath\n';
        break;

      case LogSourceType.SYSTEM:
        filepath = `./outputs/STEP_${this.evaluationStep}_system.csv`;
        logText = 'startTime, endTime, downloadTime, event, downloadedQuota, averageThroughput (bytes/ms), onMailCounter\n';
        break;
    }

    fs.appendFileSync(filepath, logText);
    return Promise.resolve();
  }

  async writeToLog(logText: string, logSourceType: LogSourceType) {
    let filepath = '';

    switch (logSourceType) {
      case LogSourceType.SINGLE_PROCESSES_OPTIMIZER:
        filepath = `./outputs/STEP_${this.evaluationStep}_single_processes_optimizer.csv`;
        break;

      case LogSourceType.PARALLEL_PROCESSES_OPTIMIZER:
        filepath = `./outputs/STEP_${this.evaluationStep}_parallel_processes_optimizer.csv`;
        break;

      case LogSourceType.DOWNLOAD_BATCH_SIZE_OPTIMIZER:
        filepath = `./outputs/STEP_${this.evaluationStep}_download_batch_size_optimizer.csv`;
        break;

      case LogSourceType.MAIL_DOWNLOAD:
        filepath = `./outputs/STEP_${this.evaluationStep}_mail_download.csv`;
        break;

      case LogSourceType.MAIL_ENCRYPTION:
        filepath = `./outputs/STEP_${this.evaluationStep}_mail_encryption.csv`;
        break;

      case LogSourceType.MAIL_UPLOAD:
        filepath = `./outputs/STEP_${this.evaluationStep}_mail_upload.csv`;
        break;

      case LogSourceType.GLOBAL:
        filepath = `./outputs/STEP_${this.evaluationStep}_global.csv`;
        break;

      case LogSourceType.SYSTEM:
        filepath = `./outputs/STEP_${this.evaluationStep}_system.csv`;
        break;
    }

    fs.appendFileSync(filepath, logText);
    return Promise.resolve();
  }
}
