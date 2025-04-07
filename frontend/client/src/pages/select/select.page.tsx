/* Lib imports */
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";

/* Types */
import { Project } from "../../types/Project";

/* Components, services & etc. */
import ProjectSelect from "../../components/project-select/project-select.component";
import { getProjects } from "../../services/project/project.service";
import { useAuth } from "../../services/auth/auth.provider";
import { isML_up } from "../../services/ML/ml.service";
import studentLabeler from "./student-marker";

/* Styling */
import "./select.page.scss";

const Select = () => {
    const { isLoggedIn, token } = useAuth();
    const [ projects, setProjects ] = useState<Project[]>([]);
    const [ isMLready, setIsMLready ] = useState<boolean>(isML_up());

    useEffect(() => {
        if (token === undefined) return;
        getProjects(token!)
            .then(studentLabeler(token!)) // This just passes the projects through and labels as a side-effect
            .then(setProjects)
            .catch(e => console.log(e));

        const mlChecker = setInterval(() => {
            if (isML_up()) {
                setIsMLready(true);
                clearInterval(mlChecker);
            }
        }, 100);
    }, [token]);

    return (
        <div className="select">
            <h1>
                The Dream Team
            </h1>
            <div className="project-select">
            {
                !isLoggedIn?
                    <p>Please log in to use the App!</p>
                :
                    isMLready?
                        <Popover placement="bottom">
                            <PopoverTrigger>
                                <button className="drop">
                                    <span>Select project</span>
                                    <span className="icon">V</span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent>
                                <div className="dropdown">
                                    {
                                        projects.map((proj, index) => (
                                            <ProjectSelect key={index} project={proj}/>
                                        ))
                                    }
                                </div>
                            </PopoverContent>
                        </Popover>
                    :
                        <p>Initilizing the machine learning model...</p>
            }
            </div>
        </div>
    )
}

export default Select;