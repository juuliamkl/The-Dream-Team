/* Types */
import { Score as ScoreType} from "../../types/Score";

/* Styling */
import "./score.component.scss";

type ScoreProps = {
    score?: ScoreType
}

const Score = ({ score }: ScoreProps) => {
    const dispScore = (import.meta.env.MODE === "development") ? Math.round(Math.random()*100) : score?.score;
    const dispMotivation = (import.meta.env.MODE === "development") ? Math.round(Math.random()*100) : score?.motivation;

    const hueMin = 25;
    const hueMax = 95;

    return (
        (import.meta.env.MODE === "development") || score !== undefined ?
        <div className="score-label">
            <span className="score" style={{"backgroundColor": `hsl(${(hueMax-hueMin) * dispScore! / 100 + hueMin}, 95%, 50%)`}}>{ dispScore }%
            </span>
            <span className="motivation" style={{"backgroundColor": `hsl(360, 0%, ${25 * dispMotivation! / 100 + 75}%)`}}>{ dispMotivation }%</span>
        </div>
        : <span>Loading Score</span>
    )
}

export default Score;