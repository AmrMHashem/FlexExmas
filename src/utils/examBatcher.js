/**
 * Exam Segmentation System
 * ≤60 questions → 2 equal parts
 * >60 questions → parts of max 40 questions each
 */
export function batchExams(questions, maxBatchSize = 40) {
  const total = questions.length;

  if (total === 0) return [];

  if (total <= 60) {
    // Split into exactly 2 equal (or near-equal) parts
    const half = Math.ceil(total / 2);
    return [
      {
        batchNumber: 1,
        questions: questions.slice(0, half),
        startIndex: 0,
        endIndex: half,
        totalQuestions: total,
      },
      {
        batchNumber: 2,
        questions: questions.slice(half),
        startIndex: half,
        endIndex: total,
        totalQuestions: total,
      },
    ];
  }

  // >60: split into parts of max 40 questions
  const batches = [];
  let batchNumber = 1;
  let startIndex = 0;

  while (startIndex < total) {
    const endIndex = Math.min(startIndex + maxBatchSize, total);
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
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    isComplete: completed === total,
  };
}

export function calculateTotalScore(batchResults) {
  if (!batchResults || batchResults.length === 0) return 0;
  const totalCorrect = batchResults.reduce((s, b) => s + (b.correct || 0), 0);
  const totalQuestions = batchResults.reduce((s, b) => s + (b.total || 0), 0);
  return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
}
