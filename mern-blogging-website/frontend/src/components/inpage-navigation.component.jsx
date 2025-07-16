import { useState, useRef, useEffect } from "react";

export let activeTabLineRef;
export let activeTabRef

const InPageNavigation = ({ routes = [], defaultHidden = [], defaultActiveIndex = 0, children }) => {
    activeTabLineRef = useRef();
    activeTabRef = useRef();

    const [inPageNavIndex, setInPageNavIndex] = useState(defaultActiveIndex);

    const changePageState = (btn, i) => {
        if (!btn) return;
        const { offsetWidth, offsetLeft } = btn;
        if (activeTabLineRef.current) {
            activeTabLineRef.current.style.width = offsetWidth + "px";
            activeTabLineRef.current.style.left = offsetLeft + "px";
        }
        setInPageNavIndex(i);
    };

    useEffect(() => {
        if (activeTabRef.current) {
            changePageState(activeTabRef.current, defaultActiveIndex);
        }
    }, []);

    return (
        <>
            <div className="relative mb-8 bg-white border-b border-grey flex flex-nowrap overflow-x-auto">
                {routes.map((route, i) => (
                    <button
                        ref={i === defaultActiveIndex ? activeTabRef : null}
                        key={i}
                        className={`p-4 px-5 capitalize ${
                            inPageNavIndex === i ? "text-black " : "text-dark-grey "
                        }${defaultHidden.includes(route) ? "md:hidden " : ""}`}
                        onClick={(e) => changePageState(e.target, i)}
                    >
                        {route}
                    </button>
                ))}
                <hr ref={activeTabLineRef} className="absolute bottom-0 duration-300" />
            </div>
            {Array.isArray(children) ? children[inPageNavIndex] : children}
        </>
    );
};

export default InPageNavigation;
