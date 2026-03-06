import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { awardCoins } from "../api/gachaApi";
import useQuizState from "../hooks/useQuizState";

export default function DailyQuiz() {
  const { token, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();
  const quiz = useQuizState();

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate("/login");
  }, [loading, isLoggedIn]);

  // Award coins when quiz finishes
  useEffect(() => {
    if (quiz.finished && token && quiz.coinReward > 0) {
      awardCoins(token, quiz.coinReward, "daily_quiz").catch(() => {});
    }
  }, [quiz.finished]);

  const handleShare = () => {
    const text = `I scored ${quiz.score} on Gojo's Challenge! ${quiz.gojoMessage} - AniView Daily Quiz`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  if (loading) return null;

  if (quiz.completedToday && !quiz.finished) {
    return (
      <div className="quiz-page container">
        <div className="quiz-completed">
          <h1>Gojo's Challenge</h1>
          <div className="quiz-gojo-icon">&#128526;</div>
          <p>You've already completed today's quiz. Come back tomorrow!</p>
        </div>
      </div>
    );
  }

  if (quiz.finished) {
    return (
      <div className="quiz-page container">
        <div className="quiz-results">
          <h1>Results</h1>
          <div className="quiz-gojo-icon">&#128526;</div>
          <div className="quiz-score-display">{quiz.score}</div>
          <p className="quiz-gojo-message">{quiz.gojoMessage}</p>
          <div className="quiz-reward">
            <span className="coin-icon">&#x1FA99;</span>
            <span>+{quiz.coinReward} AniCoins earned!</span>
          </div>
          <div className="quiz-result-buttons">
            <button className="btn btn-ghost" onClick={handleShare}>
              Share Score
            </button>
            <button className="btn btn-primary" onClick={() => navigate("/gacha")}>
              Spend Coins
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = quiz.dailyQuestions[quiz.currentQuestion];

  return (
    <div className="quiz-page container">
      <div className="quiz-header">
        <h1>Gojo's Challenge</h1>
        <div className="quiz-meta">
          <span className="quiz-progress">
            {quiz.currentQuestion + 1} / {quiz.totalQuestions}
          </span>
          <span className="quiz-score">Score: {quiz.score}</span>
        </div>
      </div>

      <div className="quiz-card">
        <div className={`quiz-timer${quiz.timeLeft <= 5 ? " danger" : ""}`}>
          <div
            className="quiz-timer-fill"
            style={{ width: `${(quiz.timeLeft / 15) * 100}%` }}
          />
          <span className="quiz-timer-text">{quiz.timeLeft}s</span>
        </div>

        <h2 className="quiz-question">{q.q}</h2>

        <div className="quiz-options">
          {q.options.map((option, i) => {
            let className = "quiz-option";
            if (quiz.answered) {
              if (i === q.answer) className += " correct";
              else if (i === quiz.selectedAnswer) className += " wrong";
            }
            return (
              <button
                key={i}
                className={className}
                onClick={() => quiz.selectAnswer(i)}
                disabled={quiz.answered}
              >
                {option}
              </button>
            );
          })}
        </div>

        {quiz.answered && (
          <button className="btn btn-primary quiz-next-btn" onClick={quiz.nextQuestion}>
            {quiz.currentQuestion < quiz.totalQuestions - 1 ? "Next Question" : "See Results"}
          </button>
        )}
      </div>
    </div>
  );
}
