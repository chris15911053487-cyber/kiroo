/**
 * 报告生成请求队列
 *
 * 限制并发数量，超出部分排队等待，防止：
 *   1. SQLite 写锁冲突（SQLITE_BUSY）
 *   2. DeepSeek API 限流（429）
 *   3. 服务器内存峰值
 */

const MAX_CONCURRENT = 3;       // 最多同时生成 3 个报告
const JOB_TIMEOUT = 180_000;    // 单个任务最长 3 分钟

let running = 0;
let queue = [];

function log(msg) {
  console.log(`[Queue] ${msg} (running=${running}, waiting=${queue.length})`);
}

/**
 * 将一个任务加入队列，等待执行完毕后返回结果
 * @param {Function} fn - 异步任务函数
 * @returns {Promise<any>} 等同于 fn() 的返回值
 */
function enqueue(fn) {
  return new Promise((resolve, reject) => {
    const job = { fn, resolve, reject, createdAt: Date.now() };

    if (running < MAX_CONCURRENT) {
      runJob(job);
    } else {
      queue.push(job);
      log(`任务排队中…`);
    }
  });
}

async function runJob(job) {
  running++;
  const waitTime = Date.now() - job.createdAt;
  log(`开始执行 (等待了 ${waitTime}ms)`);

  const timeout = new Promise((_, r) =>
    setTimeout(() => r(new Error('报告生成超时')), JOB_TIMEOUT)
  );

  try {
    const result = await Promise.race([job.fn(), timeout]);
    job.resolve(result);
    log(`执行完成`);
  } catch (err) {
    log(`执行失败: ${err.message}`);
    job.reject(err);
  } finally {
    running--;
    processNext();
  }
}

function processNext() {
  if (queue.length > 0 && running < MAX_CONCURRENT) {
    const next = queue.shift();
    runJob(next);
  }
}

/**
 * 获取队列状态（用于健康检查）
 */
function getStatus() {
  return { running, waiting: queue.length, maxConcurrent: MAX_CONCURRENT };
}

module.exports = { enqueue, getStatus };
