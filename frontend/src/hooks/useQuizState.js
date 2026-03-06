import { useState, useCallback, useEffect } from "react";
import questions from "../data/quizQuestions.json";

const QUIZ_KEY = "aniview_quiz_completed";
const QUESTIONS_PER_QUIZ = 5;
const TIME_PER_QUESTION = 15;

function getDailyQuestions() {
  const today = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash + today.charCodeAt(i)) | 0;
  }
  const shuffled = [...questions].sort((a, b) => {
    const ha = ((hash * 31 + questions.indexOf(a)) | 0) & 0x7fffffff;
    const hb = ((hash * 31 + questions.indexOf(b)) | 0) & 0x7fffffff;
    return ha - hb;
  });
  return shuffled.slice(0, QUESTIONS_PER_QUIZ);
}

function isCompletedToday() {
  const saved = localStorage.getItem(QUIZ_KEY);
  if (!saved) return false;
  return saved === new Date().toDateString();
}

const GOJO_ROASTS = {
  0: "Pathetic. Even Jogo put up a better fight.",
  1: "You call yourself an anime fan? I'm disappointed.",
  2: "Average. Just like Yuji before training.",
  3: "Not bad. You might survive a Domain Expansion.",
  4: "Impressive! You've earned my respect... almost.",
  5: "Perfect! You truly are the honored one.",
};

export default function useQuizState() {
  const [dailyQuestions] = useState(getDailyQuestions);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [finished, setFinished] = useState(false);
  const [completedToday, setCompletedToday] = useState(isCompletedToday);

  useEffect(() => {
    if (finished || answered || completedToday) return;
    if (timeLeft <= 0) {
      setAnswered(true);
      setSelectedAnswer(-1);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, finished, answered, completedToday]);

  const selectAnswer = useCallback((index) => {
    if (answered) return;
    setAnswered(true);
    setSelectedAnswer(index);
    const correct = dailyQuestions[currentQuestion].answer;
    if (index === correct) {
      const speedBonus = timeLeft > 10 ? 50 : 0;
      setScore((s) => s + 100 + speedBonus);
    }
  }, [answered, currentQuestion, dailyQuestions, timeLeft]);

  const nextQuestion = useCallback(() => {
    if (currentQuestion >= QUESTIONS_PER_QUIZ - 1) {
      setFinished(true);
      localStorage.setItem(QUIZ_KEY, new Date().toDateString());
      setCompletedToday(true);
    } else {
      setCurrentQuestion((c) => c + 1);
      setTimeLeft(TIME_PER_QUESTION);
      setAnswered(false);
      setSelectedAnswer(null);
    }
  }, [currentQuestion]);

  const coinReward = Math.min(50, Math.max(20, Math.floor(score / 15)));
  const correctCount = Math.round(score / 100); // approximate
  const gojoMessage = GOJO_ROASTS[Math.min(5, Math.round(score / 150))] || GOJO_ROASTS[0];

  return {
    dailyQuestions,
    currentQuestion,
    score,
    timeLeft,
    answered,
    selectedAnswer,
    finished,
    completedToday,
    selectAnswer,
    nextQuestion,
    coinReward,
    gojoMessage,
    correctCount,
    totalQuestions: QUESTIONS_PER_QUIZ,
  };
}
