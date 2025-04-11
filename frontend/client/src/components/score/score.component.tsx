/* Types */
import { Score as ScoreType} from "../../types/Score";

/* Styling */
import "./score.component.scss";

type ScoreProps = {
    score?: ScoreType
}

const Score = ({ score }: ScoreProps) => {
    return (
        score !== undefined ?
        <div className="score-label">
            <span className="score">{ score.score }</span>
            <span className="team">{ score.motivation }</span>
        </div>
        : <span>Loading Score</span>
    )
}

export default Score;