/* Lib imports */
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { DndContext, DragEndEvent } from '@dnd-kit/core';

/* Types */
import { StudentWithLocation } from "../../types/Student";
import { ColumnCreation, ColumnType } from "../../types/Columns";

/* Components, services & etc. */
import SortColumn from "../../components/sort-column/sort-column.component";
import { updateStudentsLabels } from "./label-updater";
import { useProjectContext } from "../../services/project/project.provider";
import { addStudentsLocations } from "./students-to-columns";
import { useAuth } from "../../services/auth/auth.provider";
import { getStudents } from "../../services/student/student.service";
import { handleDragEnd } from "./drag-helpers";
import { sortFunc } from "./sorting";

/* Styling */
import "./sort.page.scss";
import { SortMethod } from "../../types/SortMethods";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { error } from "console";


const Sort = () => {
    let { id } = useParams();
    const { token } = useAuth();
    const { currentProject } = useProjectContext();

    const [ students, setStudents ] = useState<Array<StudentWithLocation>>([]);
    const [ isDragging, setDragging ] = useState<boolean>(false);

    const [ sortType, setSortType ] = useState<SortMethod>("default");
    const [ isAscending, setAscending ] = useState<boolean>(true);

    useEffect(() => {
        if (token === undefined) return;

        getStudents(+id!, token)
            .then(addStudentsLocations(ColumnCreation.Initial))
            .then(setStudents);
    }, []);

    const onDragEnd = (event: DragEndEvent) => {
        setDragging(false);
        updateStudentsLabels(currentProject!.name, event);
        handleDragEnd(students, setStudents)(event);
    }

    const handleTeamBuild = () => {
        setStudents(
            addStudentsLocations(ColumnCreation.Request)(students.map(wrapped => wrapped.student))
        );
    }

    return (
        <div className="container">
            <div className="head">
                <h1>{ currentProject?.name }</h1>
                <Popover placement="bottom">
                        <PopoverTrigger>
                            <button className="drop">
                                Select sort method
                            </button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <div className="method-dropdown">
                                <button className="method" onClick={() => setSortType("default")}>
                                    None
                                </button> 
                                <button className="method" onClick={() => {
                                    setSortType("name");
                                    setAscending(true);
                                }}>
                                    Name ascending
                                </button>
                                <button className="method" onClick={() => {
                                    setSortType("name");
                                    setAscending(false);
                                }}>
                                    Name descending
                                </button>          
                                <button className="method" onClick={() => {
                                    throw new Error ("Score ascending not implemented")
                                }}>
                                    Score ascending
                                </button>
                                <button className="method" onClick={() => {
                                    throw new Error ("Score descending not implemented")
                                }}>
                                    Score descending
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                <button className="build-team" onClick={handleTeamBuild}>Build team</button>
            </div>
            <div className="columns">
                <DndContext onDragEnd={onDragEnd} onDragStart={() => setDragging(true)}>
                    {
                        Object.keys(ColumnType)
                            .filter(v => isNaN(Number(v)))
                            .map((col, idx) => 
                                <SortColumn
                                    key={idx}
                                    id={idx}
                                    name={col}
                                    sorter={sortFunc(sortType, !isAscending)}
                                    isDragging={isDragging}
                                    students={
                                        students
                                            .filter((wrapped) => wrapped.column != null ? +wrapped.column === idx : 0)
                                            .map(wrapped => { return { student: wrapped.student, row: wrapped.row }})
                                    }
                                />
                            )
                    }
                </DndContext>
            </div>
        </div>
    );
}

export default Sort;