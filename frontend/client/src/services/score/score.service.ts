import { AuthToken } from "../../types/Auth";
import { Project } from "../../types/Project";
import { ProjectScore, ProjectTeam } from "../../types/Score";
import { callAPI, callAPI_raw, USE_SERVER } from "../api/api.service";

export const initML = (token: AuthToken): Promise<boolean> => {
    const errorHandler = (reason: any): boolean => {
        console.log("[ML INIT ERROR] --- " + reason);
        return false;
    };

    return USE_SERVER ? callAPI_raw(`/init`, token, "POST").then(resp => resp.ok).catch(errorHandler) : Promise.reject("NO ML TO INIT");
}

export const createPredictions = (token: AuthToken): Promise<boolean> => {
    const errorHandler = (reason: any): boolean => {
        console.log("[API PREDICTION ERROR] --- " + reason);
        return false;
    };

    return USE_SERVER ? callAPI_raw(`/projects/predict`, token, "POST").then(resp => resp.ok).catch(errorHandler) : Promise.reject("NO PROJECT PREDICTION");
}

export const getScores = (projectID: Project["id"], token: AuthToken): Promise<ProjectScore> => {
    const errorHandler = (reason: any): ProjectScore => {
        console.log("[GET SCORES ERROR] --- " + reason);
        return { projectId: -1, scores: [] };
    };

    return USE_SERVER ? callAPI<ProjectScore>(`/projects/${projectID}/scores`, token).catch(errorHandler) : Promise.reject("NO DEFAULT SCORES");
}

export const getTeam = (projectID: Project["id"], token: AuthToken): Promise<ProjectTeam> => {
    const errorHandler = (reason: any): ProjectTeam => {
        console.log("[GET SCORES ERROR] --- " + reason);
        return { projectId: -1, team: [] };
    };

    return USE_SERVER ? callAPI<ProjectTeam>(`/projects/${projectID}/team`, token, "POST").catch(errorHandler) : Promise.reject("NO DEFAULT SCORES");
}