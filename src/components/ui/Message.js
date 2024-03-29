/** @format */

import React, { useState, useEffect, useRef } from "react";
import { DateTime } from "luxon";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const fetchImage = async (uri) => {
  try {
    const response = await fetch(
      `https://secondary.dev.tadeasfort.com/${uri.replace(
        "messages/inbox/",
        "inbox/"
      )}`
    );
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(error);
  }
};

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
  const [imageSrc, setImageSrc] = useState(null);
  const placeholderStyle = { width: "20em", height: "15em" }; // Adjust this to your needs

  useEffect(() => {
    if (message.photos && message.photos.length > 0) {
      fetchImage(message.photos[0].uri).then((src) => {
        setImageSrc(src);
        // No need to call updateHeight here directly, it will be called after image load
      });
    }
  }, [message.photos]);

  useEffect(() => {
    if (messageContainerRef.current) {
      const height = messageContainerRef.current.offsetHeight;
      setRowHeight(index, height);
    }
  }, [message, index, setRowHeight, visibility, imageSrc]);

  const errorFile = {
    fontWeight: "bold",
  };

  const updateHeight = () => {
    if (messageContainerRef.current) {
      const height = messageContainerRef.current.offsetHeight;
      setRowHeight(index, height);
    }
  };

  const whatKindIs = () => {
    if (imageSrc) {
      return (
        <LazyLoadImage
          effect="blur"
          src={imageSrc}
          alt={`Message Image`}
          afterLoad={() => updateHeight()} // This is a new function to calculate and update height
        />
      );
    }

    if (message.photos && message.photos.length > 0) {
      return <div style={placeholderStyle} />;
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
    if (!isCrossCollection) {
      if (clickCounter % 2 === 0) {
        setVisibility(!visibility);
      }
    }
  };
  useEffect(() => {
    setClickCounter(0);
    setVisibility(isCrossCollection ? true : false);
  }, [message, isCrossCollection]);

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
                ? "message-sent text-xl bg-backgroundsent hover:bg-backgroundreceived text-secondary-foreground max-w-[75%]"
                : "message-received text-xl bg-backgroundreceived hover:bg-backgroundsent text-accent-foreground max-w-[95%]"
            } ${clickCounter % 2 === 1 ? "bg-destructive" : ""} ${
              isHighlighted ? "bg-red-500" : ""
            } rounded-lg p-5 max-w-4/5`}
            onClick={handleClick}
          >
            <div
              className="sender-name"
              style={{
                display: isCrossCollection || visibility ? "block" : "none", // Always show if isCrossCollection is true
                // other styles
              }}
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
