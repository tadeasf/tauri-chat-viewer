/** @format */

import React, { useState } from "react";
import { DateTime } from "luxon";
import { Card } from "./../ui/card";

const Message = ({ message, time, type, author, uuid, isHighlighted }) => {
  const [visibility, setVisibility] = useState(false);

  const errorFile = {
    fontWeight: "bold",
  };

  const whatKindIs = () => {
    if (type === "Image") {
      return (
        <img
          src={`data:image/jpeg;base64,${message.content}`}
          alt="Message content"
        />
      );
    }
    if (type === "Generic" || type === null) {
      if (message.content) return <p>{message.content}</p>;
      else if (message.photos)
        return <p style={errorFile}>Foto isn't available</p>;
      else if (message.videos)
        return <p style={errorFile}>Video isn't available</p>;
      else if (message.audio_files)
        return <p style={errorFile}>Audio isn't available</p>;

      return false;
    }
    if (message.content) return <p>{message.content}</p>;
    else if (message.share)
      return (
        <a
          href={message.share.link}
          className="post-link"
          target="_blank"
          rel="noreferrer"
        >
          {message.share.link}
        </a>
      );

    return false;
  };

  const handleClick = () => {
    setVisibility(!visibility);
  };

  return (
    <>
      {whatKindIs() ? (
        <div
          data-uuid={uuid}
          style={
            visibility ? { display: "flex", zIndex: 1000 } : { display: "flex" }
          }
          className={`message-container ${
            author ? "message-sent-container" : ""
          }`}
        >
          <Card
            onClick={handleClick}
            className={`message ${
              author ? "message-sent" : "message-received"
            } ${isHighlighted ? "message-highlighted" : ""}`}
          >
            {visibility && (
              <h3 style={{ fontSize: "1em", padding: "0.5em" }}>
                {message.sender_name}
              </h3>
            )}
            {type === "Image" ? (
              // Using regular img tag since shadcn doesn't have a direct Image component
              <img
                src={`data:image/jpeg;base64,${message.content}`}
                alt="Message content"
              />
            ) : type === "Generic" || type === null ? (
              message.content ? (
                <p>{message.content}</p>
              ) : (
                <p style={errorFile}>Content isn't available</p>
              )
            ) : (
              <a href={message.share.link} target="_blank" rel="noreferrer">
                {message.share.link}
              </a>
            )}
            {visibility && (
              <p
                style={{
                  fontSize: "0.85em",
                  padding: "0.5em",
                  fontStyle: "italic",
                }}
              >
                {DateTime.fromSeconds(time / 1000).toLocaleString()}
              </p>
            )}
          </Card>
        </div>
      ) : null}
    </>
  );
};

export default Message;
