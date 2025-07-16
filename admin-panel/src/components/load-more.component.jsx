import { useContext } from "react";
import { ThemeContext } from "../App";

const LoadMoreDataBtn = ({ state, fetchDataFun, additionalParam }) => {
    const { theme } = useContext(ThemeContext);
    let btnClass = theme === "dark"
        ? "bg-purple-600 text-white p-2 px-4 rounded-md flex items-center gap-2 font-semibold shadow hover:bg-purple-700 transition-colors duration-150"
        : "bg-white border border-purple-600 text-purple-700 p-2 px-4 rounded-md flex items-center gap-2 font-semibold shadow hover:bg-purple-100 transition-colors duration-150";
    if (
        state &&
        typeof state.totalDocs === 'number' &&
        Array.isArray(state.results) &&
        state.totalDocs > state.results.length
    ) {
        return (
            <button
                onClick={() => fetchDataFun({ ...(additionalParam || {}), page: (state.page || 1) + 1 })}
                className={btnClass}
            >
                Load More
            </button>
        );
    }
    return null;
};

export default LoadMoreDataBtn; 