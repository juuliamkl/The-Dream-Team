/* Types */
import { AuthToken } from "../../types/Auth";

/* Components, services & etc. */
import { createPredictions, initML } from "../score/score.service";
import storage from "../storage/storage.service";


export const setML_status = (isUp: boolean): void => { storage.update<boolean>("ml-up", _ => isUp) ? undefined : storage.save<boolean>(isUp, "ml-up") };
export const isML_up = (): boolean => storage.get<boolean>("ml-up") ?? false;

export const callInitML = (token: AuthToken): void => {
    initML(token)
    .then(() => console.log("[INIT ML]"))
    .then(() => createPredictions(token).then(() => console.log("[CREATED PREDICTIONS]")).catch(console.log))
    .then(() => setML_status(true))
    .catch(console.log);
}
