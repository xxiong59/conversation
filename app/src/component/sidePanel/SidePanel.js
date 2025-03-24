import React, { useRef } from "react";
import cn from "classnames";
import { RiSidebarFoldLine, RiSidebarUnfoldLine } from "react-icons/ri";
import Select from "react-select";

function SidePanel() {
  // UI状态示例 - 实际应用中这些会从props接收或通过hooks管理
  const open = true;
  const connected = false;
  const logs = [];
  const textInput = "";
  const selectedOption = null;
  
  // Refs
  // const loggerRef = useRef(null);
  const inputRef = useRef(null);
  
  // 占位函数 - 实际应用中会替换为真实函数
  const setOpen = () => {};
  const setSelectedOption = () => {};
  const setTextInput = () => {};
  const handleSubmit = () => {};
  
  // 过滤选项
  const filterOptions = [
    { value: "conversations", label: "Conversations" },
    { value: "tools", label: "Tool Use" },
    { value: "none", label: "All" },
  ];

  return (
    <div className={`side-panel ${open ? "open" : ""}`}>
      <header className="top">
        <h2>Console</h2>
        {open ? (
          <button className="opener" onClick={() => setOpen(false)}>
            <RiSidebarFoldLine color="#b4b8bb" />
          </button>
        ) : (
          <button className="opener" onClick={() => setOpen(true)}>
            <RiSidebarUnfoldLine color="#b4b8bb" />
          </button>
        )}
      </header>
      <section className="indicators">
        <Select
          className="react-select"
          classNamePrefix="react-select"
          styles={{
            control: (baseStyles) => ({
              ...baseStyles,
              background: "var(--Neutral-15)",
              color: "var(--Neutral-90)",
              minHeight: "33px",
              maxHeight: "33px",
              border: 0,
            }),
            option: (styles, { isFocused, isSelected }) => ({
              ...styles,
              backgroundColor: isFocused
                ? "var(--Neutral-30)"
                : isSelected
                  ? "var(--Neutral-20)"
                  : undefined,
            }),
          }}
          defaultValue={selectedOption}
          options={filterOptions}
          onChange={(e) => {
            setSelectedOption(e);
          }}
        />
        <div className={cn("streaming-indicator", { connected })}>
          {connected
            ? `🔵${open ? " Streaming" : ""}`
            : `⏸️${open ? " Paused" : ""}`}
        </div>
      </section>
      {/* <div className="side-panel-container" ref={loggerRef}>
        <Logger
          filter={(selectedOption?.value) || "none"}
        />
      </div> */}
      <div className={cn("input-container", { disabled: !connected })}>
        <div className="input-content">
          <textarea
            className="input-area"
            ref={inputRef}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
              }
            }}
            onChange={(e) => setTextInput(e.target.value)}
            value={textInput}
          ></textarea>
          <span
            className={cn("input-content-placeholder", {
              hidden: textInput.length,
            })}
          >
            Type&nbsp;something...
          </span>

          <button
            className="send-button material-symbols-outlined filled"
            onClick={handleSubmit}
          >
            send
          </button>
        </div>
      </div>
    </div>
  );
}

export default SidePanel;