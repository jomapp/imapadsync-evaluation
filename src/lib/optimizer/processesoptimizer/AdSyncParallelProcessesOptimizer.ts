import { OptimizerUpdateAction, THROUGHPUT_THRESHOLD } from '../AdSyncOptimizer.js';
import { AdSyncProcessesOptimizer } from './AdSyncProcessesOptimizer.js';
import { LogSourceType } from '../../utils/AdSyncLogger.js';

const MINIMUM_PARALLEL_PROCESSES = 2;
const MAX_PARALLEL_PROCESSES = 15;

export class AdSyncParallelProcessesOptimizer extends AdSyncProcessesOptimizer {
  private optimizerUpdateActionHistory: OptimizerUpdateAction[] = [OptimizerUpdateAction.NO_UPDATE];
  private maxParallelProcesses: number = MAX_PARALLEL_PROCESSES;

  override startAdSyncOptimizer(): void {
    super.startAdSyncOptimizer();
    this.scheduler = setInterval(this.optimize.bind(this), this.optimizationInterval * 1000); // every optimizationInterval seconds
    this.optimize(); // call once to start downloading of mails
  }

  override optimize(): void {
    let currentInterval = this.getCurrentTimeStampInterval();
    let lastInterval = this.getLastTimeStampInterval();
    let combinedAverageThroughputCurrent = this.getCombinedAverageThroughputInTimeInterval(currentInterval.fromTimeStamp, currentInterval.toTimeStamp);
    let combinedAverageThroughputLast = this.getCombinedAverageThroughputInTimeInterval(lastInterval.fromTimeStamp, lastInterval.toTimeStamp);
    console.log('(ParallelProcessOptimizer) Throughput stats: ... | ' + combinedAverageThroughputLast + ' | ' + combinedAverageThroughputCurrent + ' |');

    let lastUpdateAction = this.optimizerUpdateActionHistory.at(-1);
    if (lastUpdateAction === undefined) {
      throw new Error('The optimizerUpdateActionHistory has not been initialized correctly!');
    }

    if (combinedAverageThroughputCurrent + THROUGHPUT_THRESHOLD >= combinedAverageThroughputLast) {
      if (lastUpdateAction != OptimizerUpdateAction.DECREASE) {
        if (this.runningProcessMap.size < this.maxParallelProcesses) {
          this.startSyncSessionProcesses(this.optimizationDifference);
          this.optimizerUpdateActionHistory.push(OptimizerUpdateAction.INCREASE);
        } else {
          this.optimizerUpdateActionHistory.push(OptimizerUpdateAction.NO_UPDATE);
        }
      } else if (this.runningProcessMap.size > 1) {
        this.stopSyncSessionProcesses(1);
        this.optimizerUpdateActionHistory.push(OptimizerUpdateAction.DECREASE);
      }
    } else {
      if (lastUpdateAction == OptimizerUpdateAction.INCREASE && this.runningProcessMap.size > 1) {
        this.stopSyncSessionProcesses(1);
        this.optimizerUpdateActionHistory.push(OptimizerUpdateAction.DECREASE);
      }
    }

    this.optimizerUpdateTimeStampHistory.push(currentInterval.toTimeStamp);

    this.adSyncLogger.writeToLog(
      `${currentInterval.fromTimeStamp}, ${currentInterval.toTimeStamp}, ${combinedAverageThroughputCurrent}, ${this.optimizerUpdateActionHistory.at(
        -1
      )}, ${this.maxParallelProcesses}, ${this.runningProcessMap.size}, ${[...this.runningProcessMap.values()].map((value) => value.mailboxPath)}\n`,
      LogSourceType.PARALLEL_PROCESSES_OPTIMIZER
    );
  }

  forceStopSyncSessionProcess(processId: number, isExceededRateLimit: boolean = false) {
    super.forceStopSyncSessionProcess(processId);
    if (isExceededRateLimit && this.runningProcessMap.size >= MINIMUM_PARALLEL_PROCESSES) {
      this.maxParallelProcesses = this.runningProcessMap.size - 1;
    }
  }
}
