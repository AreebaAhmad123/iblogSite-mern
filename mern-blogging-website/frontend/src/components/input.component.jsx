import { useState } from "react";

const InputBox = ({ name, type, placeholder, value, id, icon, disable = false, onChange, readOnly = false, ...rest }) => {
    const [passwordvisible, setpasswordvisible] = useState(false);

    // Only set value if both value and onChange are provided (controlled)
    const inputProps = {
        name,
        type: type === "password" ? (passwordvisible ? "text" : "password") : type,
        placeholder,
        id,
        disabled: disable,
        readOnly,
        className: "input-box",
        onChange,
        ...(type === "password" ? { autoComplete: "current-password" } : {}),
        ...rest,
    };
    if (value !== undefined && onChange) {
        inputProps.value = value;
    }

    return (
        <div className="relative w-[100%] mb-4">
            <input {...inputProps} />
            <i className={"fi " + icon + " input-icon"}></i>
            {type === "password" ? (
                <i
                    className={"fi fi-rr-eye" + (!passwordvisible ? "-crossed" : "") + " input-icon left-[auto] right-4 cursor-pointer"}
                    onClick={() => setpasswordvisible(currentVal => !currentVal)}
                ></i>
            ) : ""}
        </div>
    );
};
export default InputBox;