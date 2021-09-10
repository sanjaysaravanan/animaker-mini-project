import React from "react";

const AddCell = ({ type, onClick }) => {
  return (
    <div
      style={{
        width: "95px",
        height: "31px",
        color: "#fff",
        backgroundColor: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      Add {type}
    </div>
  );
};

export default AddCell;
