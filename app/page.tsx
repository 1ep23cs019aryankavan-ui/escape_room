"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type CompletionRecord = {
  teamName: string;
  points: number;
  completedAt: string;
  elapsedSeconds: number;
};

type HintSet = { used: boolean[] };

const TOTAL_TIME_SECONDS = 150 * 60;
const WRONG_PENALTY = 10;
const LEVEL_POINTS = {
  level1: 150,
  l2q1: 50,
  l2q3: 50,
  l3q1: 50,
  l3q2: 50,
  l3q3: 50,
  level4: 100
};

const LEVEL_CODES = {
  level1: "GATE150",
  level2: "EBFK",
  level3: "SQLPASS",
  level4: "HACKOVERS"
};

const DEBUG_PYTHON = `nums = [2, 4, 6, 8]
total = 0
for i in range(len(nums)):
    total += nums[i] // 2
print(total + 3)`;

const SQL_CHALLENGE = `SELECT
  e.emp_id,
  e.name,
  d.dept_name,
  CASE WHEN e.rating > 4 THEN 'HIGH' ELSE 'NORMAL' END AS rank_tag,
  CONCAT('shift_', SUBSTRING(e.shift_code, 1, 1), '_2026') AS shift_key,
  'password=SQLPASS' AS audit_token
FROM employees e
JOIN departments d ON d.dept_id = e.dept_id
WHERE e.status = 'ACTIVE'
  AND e.joined_at >= '2024-01-01'
  AND d.location IN ('Block-A', 'Block-B')
ORDER BY e.rating DESC, e.emp_id ASC;`;

const MODEL_TABLE = [
  { name: "Logistic Regression", acc: "0.9100", f1: "0.8900" },
  { name: "SVM (RBF)", acc: "0.9270", f1: "0.9021" },
  { name: "XGBoost", acc: "1.2300", f1: "0.9142" },
  { name: "Random Forest", acc: "0.9341", f1: "0.9198" },
  { name: "LightGBM", acc: "0.9388", f1: "0.9225" }
];

function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const h = String(Math.floor(safe / 3600)).padStart(2, "0");
  const m = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function useHints() {
  const [hints, setHints] = useState<Record<string, HintSet>>({});
  const applyHint = (key: string, index: number) => {
    setHints((prev) => {
      const old = prev[key]?.used ?? [false, false, false];
      const next = [...old];
      next[index] = true;
      return { ...prev, [key]: { used: next } };
    });
  };
  return { hints, applyHint };
}

export default function Page() {
  const [teamName, setTeamName] = useState("");
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const [points, setPoints] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_SECONDS);
  const [wrongCount, setWrongCount] = useState(0);
  const [records, setRecords] = useState<CompletionRecord[]>([]);

  const [l1Answer, setL1Answer] = useState("");
  const [l1Done, setL1Done] = useState(false);

  const [l2q1, setL2q1] = useState("");
  const [l2q1Done, setL2q1Done] = useState(false);
  const [queenPositions, setQueenPositions] = useState<number[]>([]);
  const [l2q2Done, setL2q2Done] = useState(false);
  const [l2q3, setL2q3] = useState("");
  const [l2Done, setL2Done] = useState(false);

  const [l3q1, setL3q1] = useState("");
  const [l3q1Done, setL3q1Done] = useState(false);
  const [l3q2, setL3q2] = useState("");
  const [l3q2Done, setL3q2Done] = useState(false);
  const [l3q3, setL3q3] = useState("");
  const [l3Done, setL3Done] = useState(false);

  const [l4, setL4] = useState("");
  const [l4Done, setL4Done] = useState(false);

  const [finalCodes, setFinalCodes] = useState({ c1: "", c2: "", c3: "", c4: "" });
  const [escaped, setEscaped] = useState(false);

  const { hints, applyHint } = useHints();

  useEffect(() => {
    if (!started || escaped) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, escaped]);

  useEffect(() => {
    void fetch("/api/scoreboard")
      .then((r) => r.json())
      .then((d: CompletionRecord[]) => setRecords(d))
      .catch(() => setRecords([]));
  }, []);

  const marqueeText = useMemo(() => {
    const leaders = records
      .slice(0, 5)
      .map((r) => `${r.teamName} (${r.points} pts, ${formatTime(TOTAL_TIME_SECONDS - r.elapsedSeconds)})`)
      .join(" | ");
    const live = started
      ? `LIVE: ${teamName || "Team"} | Score: ${points} | Time Left: ${formatTime(timeLeft)} | Level: ${level}`
      : "Register team and start the round.";
    return leaders ? `${live} | LEADERBOARD: ${leaders}` : live;
  }, [records, started, teamName, points, timeLeft, level]);

  const deductWrong = () => {
    setWrongCount((c) => c + 1);
    setPoints((p) => p - WRONG_PENALTY);
  };

  const useHint = (questionKey: string, hintIdx: number) => {
    const scoreCost = [10, 20, 30][hintIdx];
    const secCost = [300, 600, 900][hintIdx];
    const used = hints[questionKey]?.used ?? [false, false, false];
    if (used[hintIdx]) return;
    applyHint(questionKey, hintIdx);
    setPoints((p) => p - scoreCost);
    setTimeLeft((t) => Math.max(0, t - secCost));
  };

  const startGame = (e: FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setStarted(true);
  };

  const validateLevel1 = () => {
    if (l1Answer.trim() === "0101") {
      setL1Done(true);
      setPoints((p) => p + LEVEL_POINTS.level1);
      setLevel(2);
      return;
    }
    deductWrong();
  };

  const validateL2Q1 = () => {
    if (l2q1.trim() === "13") {
      setL2q1Done(true);
      setPoints((p) => p + LEVEL_POINTS.l2q1);
      return;
    }
    deductWrong();
  };

  const toggleQueen = (cell: number) => {
    setQueenPositions((prev) => (prev.includes(cell) ? prev.filter((x) => x !== cell) : [...prev, cell]));
  };

  const validateQueens = () => {
    const solution = [1, 7, 8, 14];
    const sorted = [...queenPositions].sort((a, b) => a - b);
    if (sorted.length === 4 && solution.every((v, i) => sorted[i] === v)) {
      setL2q2Done(true);
      return;
    }
    deductWrong();
  };

  const validateL2Q3 = () => {
    if (l2q3.trim().toUpperCase() === "EBFK") {
      setPoints((p) => p + LEVEL_POINTS.l2q3);
      setL2Done(true);
      setLevel(3);
      return;
    }
    deductWrong();
  };

  const validateL3Q1 = () => {
    if (l3q1.trim() === "24") {
      setL3q1Done(true);
      setPoints((p) => p + LEVEL_POINTS.l3q1);
      return;
    }
    deductWrong();
  };

  const validateL3Q2 = () => {
    if (l3q2.trim() === "1.2300") {
      setL3q2Done(true);
      setPoints((p) => p + LEVEL_POINTS.l3q2);
      return;
    }
    deductWrong();
  };

  const validateL3Q3 = () => {
    if (l3q3.trim().toUpperCase() === "SQLPASS") {
      setL3Done(true);
      setPoints((p) => p + LEVEL_POINTS.l3q3);
      setLevel(4);
      return;
    }
    deductWrong();
  };

  const validateL4 = () => {
    if (l4.trim().toUpperCase() === "HACKOVERS") {
      setL4Done(true);
      setPoints((p) => p + LEVEL_POINTS.level4);
      setLevel(5);
      return;
    }
    deductWrong();
  };

  const finishEscape = async () => {
    const ok =
      finalCodes.c1.toUpperCase() === LEVEL_CODES.level1 &&
      finalCodes.c2.toUpperCase() === LEVEL_CODES.level2 &&
      finalCodes.c3.toUpperCase() === LEVEL_CODES.level3 &&
      finalCodes.c4.toUpperCase() === LEVEL_CODES.level4;

    if (!ok) {
      deductWrong();
      return;
    }

    setEscaped(true);
    const payload: CompletionRecord = {
      teamName,
      points,
      completedAt: new Date().toISOString(),
      elapsedSeconds: TOTAL_TIME_SECONDS - timeLeft
    };
    await fetch("/api/scoreboard", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const refreshed = await fetch("/api/scoreboard").then((r) => r.json());
    setRecords(refreshed);
  };

  return (
    <main className={`app level-${Math.min(level, 4)}`}>
      <header className="topbar">
        <div className="marquee-wrap">
          <div className="marquee-track">{marqueeText}</div>
        </div>
      </header>
      <section className="container">
        <h1>Hackovers: Technical Escape Room</h1>
        {!started ? (
          <form onSubmit={startGame} className="card">
            <p>Enter your team name to start the 2h 30m challenge.</p>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team Name" />
            <button type="submit">Start Challenge</button>
          </form>
        ) : (
          <>
            <div className="stats">
              <span>Team: {teamName}</span>
              <span>Score: {points}</span>
              <span>Wrong Attempts: {wrongCount}</span>
              <span>Timer: {formatTime(timeLeft)}</span>
            </div>

            {level === 1 && (
              <div className="card">
                <h2>Level 1 - Logical Gate Simulator (150 points)</h2>
                <p>Convert decimal 13 into binary. Then apply: (A AND B) OR (C XOR D) where A=1,B=1,C=0,D=1.</p>
                <p>Enter final 4-bit output:</p>
                <input value={l1Answer} onChange={(e) => setL1Answer(e.target.value)} placeholder="Example: 0101" />
                <button onClick={validateLevel1}>Submit Level 1</button>
                {l1Done && (
                  <p className="success">
                    Correct. Level 1 code: <b>{LEVEL_CODES.level1}</b>. Level 2 unlocked.
                  </p>
                )}
              </div>
            )}

            {level >= 2 && (
              <div className="card l2">
                <h2>Level 2 (3 Questions)</h2>
                <h3>Q2.1 Debug Python (50 points)</h3>
                <textarea readOnly value={DEBUG_PYTHON} />
                <input value={l2q1} onChange={(e) => setL2q1(e.target.value)} placeholder="Output?" />
                <div className="row">
                  <button onClick={validateL2Q1}>Check Q2.1</button>
                  <button onClick={() => useHint("l2q1", 0)}>Hint 1</button>
                  <button onClick={() => useHint("l2q1", 1)}>Hint 2</button>
                  <button onClick={() => useHint("l2q1", 2)}>Hint 3</button>
                </div>

                {l2q1Done && (
                  <>
                    <h3>Q2.2 Visual N-Queens</h3>
                    <p>Place 4 queens on the 4x4 board correctly.</p>
                    <div className="board">
                      {Array.from({ length: 16 }).map((_, idx) => (
                        <button
                          key={idx}
                          className={`cell ${(Math.floor(idx / 4) + (idx % 4)) % 2 === 0 ? "light" : "dark"}`}
                          onClick={() => toggleQueen(idx)}
                        >
                          {queenPositions.includes(idx) ? "Q" : ""}
                        </button>
                      ))}
                    </div>
                    <button onClick={validateQueens}>Check Q2.2</button>
                  </>
                )}

                {l2q2Done && (
                  <>
                    <h3>Q2.3 Pattern</h3>
                    <p>
                      If CODING is written as ABFDEC and ESCAPE is written as KHJIGK then what is NODE?
                    </p>
                    <input value={l2q3} onChange={(e) => setL2q3(e.target.value)} />
                    <button onClick={validateL2Q3}>Check Q2.3</button>
                    {l2Done && (
                      <p className="success">
                        Level 2 code: <b>{LEVEL_CODES.level2}</b>. Level 3 unlocked.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {level >= 3 && (
              <div className="card l3">
                <h2>Level 3 (3 Questions)</h2>
                <h3>Q3.1 Python Array Output (50 points)</h3>
                <pre>{`arr = [3, 5, 7, 9]
for i in range(len(arr)):
    arr[i] = arr[i] - i
print(sum(arr))`}</pre>
                <input value={l3q1} onChange={(e) => setL3q1(e.target.value)} placeholder="Output?" />
                <button onClick={validateL3Q1}>Check Q3.1</button>

                {l3q1Done && (
                  <>
                    <h3>Q3.2 Find Poisoned ML Metric (50 points)</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Model</th>
                          <th>Accuracy</th>
                          <th>F1</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MODEL_TABLE.map((m) => (
                          <tr key={m.name}>
                            <td>{m.name}</td>
                            <td>{m.acc}</td>
                            <td>{m.f1}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <input value={l3q2} onChange={(e) => setL3q2(e.target.value)} placeholder="Poison value?" />
                    <button onClick={validateL3Q2}>Check Q3.2</button>
                  </>
                )}

                {l3q2Done && (
                  <>
                    <h3>Q3.3 SQL Password Hunt (50 points)</h3>
                    <textarea readOnly value={SQL_CHALLENGE} />
                    <input value={l3q3} onChange={(e) => setL3q3(e.target.value)} placeholder="Password?" />
                    <button onClick={validateL3Q3}>Check Q3.3</button>
                    {l3Done && (
                      <p className="success">
                        Level 3 code: <b>{LEVEL_CODES.level3}</b>. Level 4 unlocked.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {level >= 4 && (
              <div className="card l4">
                <h2>Level 4 - Hidden Word in Photo (100 points)</h2>
                <img src="/hidden-photo.svg" alt="Find hidden word" className="photo" />
                <input value={l4} onChange={(e) => setL4(e.target.value)} placeholder="Hidden word?" />
                <button onClick={validateL4}>Check Level 4</button>
                {l4Done && (
                  <p className="success">
                    Level 4 code: <b>{LEVEL_CODES.level4}</b>
                  </p>
                )}
              </div>
            )}

            {l1Done && l2Done && l3Done && l4Done && !escaped && (
              <div className="card final">
                <h2>Final Escape Check</h2>
                <p>Enter all level codes to escape:</p>
                <input
                  placeholder="Code Level 1"
                  value={finalCodes.c1}
                  onChange={(e) => setFinalCodes((p) => ({ ...p, c1: e.target.value }))}
                />
                <input
                  placeholder="Code Level 2"
                  value={finalCodes.c2}
                  onChange={(e) => setFinalCodes((p) => ({ ...p, c2: e.target.value }))}
                />
                <input
                  placeholder="Code Level 3"
                  value={finalCodes.c3}
                  onChange={(e) => setFinalCodes((p) => ({ ...p, c3: e.target.value }))}
                />
                <input
                  placeholder="Code Level 4"
                  value={finalCodes.c4}
                  onChange={(e) => setFinalCodes((p) => ({ ...p, c4: e.target.value }))}
                />
                <button onClick={finishEscape}>Escape Room</button>
              </div>
            )}

            {escaped && (
              <div className="card success-card">
                <h2>Escape Successful</h2>
                <p>
                  Team <b>{teamName}</b> escaped with <b>{points}</b> points. Elapsed time:{" "}
                  <b>{formatTime(TOTAL_TIME_SECONDS - timeLeft)}</b>.
                </p>
              </div>
            )}

            <div className="card admin">
              <h2>Admin Panel - Team Results</h2>
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Points</th>
                    <th>Elapsed</th>
                    <th>Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, idx) => (
                    <tr key={`${r.teamName}-${idx}`}>
                      <td>{r.teamName}</td>
                      <td>{r.points}</td>
                      <td>{formatTime(r.elapsedSeconds)}</td>
                      <td>{new Date(r.completedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
