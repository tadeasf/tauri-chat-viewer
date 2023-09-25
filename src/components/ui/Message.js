/** @format */

import React, { useState, useEffect, useRef } from "react";
import { DateTime } from "luxon";

const Message = ({
  message,
  time,
  type,
  index,
  setRowHeight,
  author,
  uuid,
  isHighlighted,
  isCrossCollection,
}) => {
  const [clickCounter, setClickCounter] = useState(0);
  const [visibility, setVisibility] = useState(false);
  const messageContainerRef = useRef(null);

  useEffect(() => {
    if (messageContainerRef.current) {
      const height = messageContainerRef.current.offsetHeight;
      setRowHeight(index, height);
    }
  }, [message, index, setRowHeight, visibility]);

  const errorFile = {
    fontWeight: "bold",
  };

  const whatKindIs = () => {
    if (message.photos && message.photos.length > 0) {
      return message.photos.map((photo, index) => (
        <img
          key={index}
          src={`https://server.kocouratko.eu/${photo.uri.replace(
            "messages/inbox/",
            "inbox/"
          )}`}
          alt={`fb obrazek ${index + 1}`}
        />
      ));
    }

    if (message.content) return <p>{message.content}</p>;
    if (message.videos) return <p style={errorFile}>Video isn't available</p>;
    if (message.audio_files)
      return <p style={errorFile}>Audio isn't available</p>;
    if (message.share)
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
    setClickCounter((prevCounter) => prevCounter + 1);
    if (clickCounter % 2 === 0) {
      setVisibility(!visibility);
    }
  };

  useEffect(() => {
    setClickCounter(0);
    setVisibility(false);
  }, [message]);

  return (
    <>
      {whatKindIs() ? (
        <div
          ref={messageContainerRef}
          data-uuid={uuid}
          style={
            visibility ? { display: "flex", zIndex: 1000 } : { display: "flex" }
          }
          className={`message-container flex ${
            author ? "justify-end" : "justify-start ml-5"
          }`}
        >
          <div
            className={`message ${
              author
                ? "message-sent text-sm bg-backgroundsent hover:bg-backgroundreceived text-secondary-foreground max-w-[85%]"
                : "message-received text-lg bg-backgroundreceived hover:bg-backgroundsent text-accent-foreground max-w-[85%]"
            } ${clickCounter % 2 === 1 ? "bg-destructive" : ""} ${
              isHighlighted ? "bg-red-500" : ""
            } rounded-lg p-5 max-w-4/5`}
            onClick={handleClick}
          >
            <div
              className="sender-name"
              style={
                visibility
                  ? {
                      display: "block",
                      fontSize: "1em",
                      padding: "1em",
                      justifyContent: "center",
                      fontStyle: "italic",
                    }
                  : { display: "none" }
              }
            >
              {message.sender_name}
              {author && isCrossCollection
                ? ` (from ${message.collectionName})`
                : ""}
            </div>
            {whatKindIs()}
            <div
              className="time-ago"
              style={
                visibility
                  ? {
                      display: "block",
                      fontSize: "1em",
                      padding: "1em",
                      justifyContent: "center",
                      fontStyle: "italic",
                    }
                  : { display: "none" }
              }
            >
              <p>{DateTime.fromSeconds(time / 1000).toLocaleString()}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Message;
