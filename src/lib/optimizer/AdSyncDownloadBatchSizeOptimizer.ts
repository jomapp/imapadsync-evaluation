import { AdSyncOptimizer, THROUGHPUT_THRESHOLD } from "./AdSyncOptimizer.js"
import { ImapSyncSessionMailbox } from "../ImapSyncSessionMailbox.js"
import { AdSyncLogger, LogSourceType } from "../utils/AdSyncLogger.js"

const OPTIMIZATION_INTERVAL = 10 // in seconds

export class AdSyncDownloadBatchSizeOptimizer extends AdSyncOptimizer {
	protected _optimizedSyncSessionMailbox: ImapSyncSessionMailbox
	protected scheduler?: NodeJS.Timer
	protected adSyncLogger: AdSyncLogger

	constructor(syncSessionMailbox: ImapSyncSessionMailbox, optimizationDifference: number, optimizationInterval: number, adSyncLogger: AdSyncLogger) {
		super(optimizationDifference, optimizationInterval)
		this._optimizedSyncSessionMailbox = syncSessionMailbox
		this.adSyncLogger = adSyncLogger
	}

	override startAdSyncOptimizer(): void {
		super.startAdSyncOptimizer()
		this.scheduler = setInterval(this.optimize.bind(this), OPTIMIZATION_INTERVAL * 1000) // every OPTIMIZATION_INTERVAL seconds
	}

	get optimizedSyncSessionMailbox(): ImapSyncSessionMailbox {
		return this._optimizedSyncSessionMailbox
	}

	protected optimize(): void {
		let currentInterval = this.getCurrentTimeStampInterval()
		let lastInterval = this.getLastTimeStampInterval()
		let averageThroughputCurrent = this.optimizedSyncSessionMailbox.getAverageThroughputInTimeInterval(
			currentInterval.fromTimeStamp,
			currentInterval.toTimeStamp,
		)
		let averageThroughputLast = this.optimizedSyncSessionMailbox.getAverageThroughputInTimeInterval(lastInterval.fromTimeStamp, lastInterval.toTimeStamp)

		console.log(
			"(DownloadBatchSizeOptimizer -> " +
				this.optimizedSyncSessionMailbox.mailboxState.path +
				" : last downloadBatchSize | " +
				this.optimizedSyncSessionMailbox.downloadBatchSize +
				" |) Throughput stats: ... | " +
				averageThroughputLast +
				" | " +
				averageThroughputCurrent +
				" |",
		)

		let downloadBatchSizeCurrent = this.optimizedSyncSessionMailbox.getDownloadBatchSizeInTimeInterval(
			currentInterval.fromTimeStamp,
			currentInterval.toTimeStamp,
		)
		let downloadBatchSizeLast = this.optimizedSyncSessionMailbox.getDownloadBatchSizeInTimeInterval(lastInterval.fromTimeStamp, lastInterval.toTimeStamp)
		let downloadBatchSizeDidIncrease = downloadBatchSizeCurrent - downloadBatchSizeLast >= 0

		if (averageThroughputCurrent + THROUGHPUT_THRESHOLD >= averageThroughputLast) {
			if (downloadBatchSizeDidIncrease) {
				this.optimizedSyncSessionMailbox.downloadBatchSize = this.optimizedSyncSessionMailbox.downloadBatchSize + this.optimizationDifference
			} else if (this.optimizedSyncSessionMailbox.downloadBatchSize - this.optimizationDifference > 0) {
				this.optimizedSyncSessionMailbox.downloadBatchSize = this.optimizedSyncSessionMailbox.downloadBatchSize - this.optimizationDifference
			}
		} else {
			if (downloadBatchSizeDidIncrease && this.optimizedSyncSessionMailbox.downloadBatchSize - this.optimizationDifference > 0) {
				this.optimizedSyncSessionMailbox.downloadBatchSize = this.optimizedSyncSessionMailbox.downloadBatchSize - this.optimizationDifference
			}
		}

		this.optimizerUpdateTimeStampHistory.push(currentInterval.toTimeStamp)

		this.adSyncLogger.writeToLog(
			`${currentInterval.fromTimeStamp}, ${currentInterval.toTimeStamp}, ${averageThroughputCurrent}, ${downloadBatchSizeCurrent}, ${downloadBatchSizeDidIncrease}, ${this.optimizedSyncSessionMailbox.mailboxState.path}\n`,
			LogSourceType.DOWNLOAD_BATCH_SIZE_OPTIMIZER,
		)
	}
}
