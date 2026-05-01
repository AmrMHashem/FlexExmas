/**
 * Exam Segmentation System
 * Rules:
 *  - If questions <= 60: split into 2 equal parts
 *  - If questions > 60: split into batches of max 40 questions
 */
export function batchExams(questions) {
  const total = questions.length;
  if (total <= 60) {
    const half = Math.ceil(total / 2);
    return [
      { batchNumber: 1, questions: questions.slice(0, half), startIndex: 0, endIndex: half, totalQuestions: total },
      { batchNumber: 2, questions: questions.slice(half), startIndex: half, endIndex: total, totalQuestions: total },
    ];
  }

  const batches = [];
  const batchSize = 40;
  let batchNumber = 1;
  let startIndex = 0;

  while (startIndex < total) {
    const endIndex = Math.min(startIndex + batchSize, total);
    batches.push({
      batchNumber,
      questions: questions.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      totalQuestions: total,
    });
    startIndex = endIndex;
    batchNumber++;
  }

  return batches;
}

export function getBatchProgress(completedBatches) {
  const total = completedBatches.length;
  const completed = completedBatches.filter(b => b.completed).length;
  return {
    total,
    completed,
    percentage: Math.round((completed / total) * 100),
    isComplete: completed === total,
  };
}

export function calcBatchDuration(totalDuration, batchCount, batchIndex) {
  if (batchCount <= 0) return totalDuration;
  return Math.round(totalDuration / batchCount);
}
