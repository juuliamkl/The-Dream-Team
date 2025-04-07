export type Score = {
    score: number,
    motivation: number
}

export type ScoreRequest = {
    studentId: number,
    Score: number,
    motivation: number
}

export type ProjectScore = {
    projectId: number,
    scores: ScoreRequest[]
}

export type ProjectTeam = {
    projectId: number,
    team: ScoreRequest[]
}