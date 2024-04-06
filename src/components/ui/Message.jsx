/** @format */

import React, { useState, useEffect, useRef } from "react";
import { DateTime } from "luxon";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const fetchImage = async (uri) => {
  try {
    const processedUri = uri.replace("messages/inbox/", "");
    const response = await fetch(
      `https://secondary.dev.tadeasfort.com/inbox/${processedUri}`
    );
    console.log(`https://secondary.dev.tadeasfort.com/inbox/${processedUri}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(error);
  }
};

const Message = ({
  message,
  time,
  is_geoblocked_for_viewer,
  author,
  uuid,
  isHighlighted,
  isCrossCollection,
}) => {
  const [clickCounter, setClickCounter] = useState(0);
  const [visibility, setVisibility] = useState(false);
  const messageContainerRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const placeholderStyle = { width: "20em", height: "20em" }; // Adjust this to your needs

  useEffect(() => {
    if (message.photos && message.photos.length > 0) {
      fetchImage(message.photos[0].uri).then((src) => {
        setImageSrc(src);
      });
    }
  }, [message.photos]);

  const errorFile = {
    fontWeight: "bold",
  };

  const getMessageClasses = () => {
    // Initial base classes without the background color
    let baseClasses = `message text-xl rounded-lg p-5 max-w-4/5 ${
      author
        ? "text-secondary-foreground max-w-[75%]"
        : "text-accent-foreground max-w-[75%]"
    }`;

    // Conditional styling based on message source and author
    if (typeof is_geoblocked_for_viewer !== "undefined") {
      // Instagram messages
      baseClasses += author ? " bg-rose-900/25" : " bg-rose-500/50";
    } else {
      // Facebook messages
      baseClasses += author ? " bg-gray-800/50" : " bg-gray-500/50";
    }

    // Apply destructive background on every other click
    if (clickCounter % 2 === 1) baseClasses += " bg-destructive";

    // Highlight messages if isHighlighted is true
    if (isHighlighted) {
      // Overrides other background styles when isHighlighted is true
      baseClasses = baseClasses.replace(/bg-\S+/g, "") + " bg-cyan-500/50";
    }

    return baseClasses.trim();
  };

  const whatKindIs = () => {
    if (imageSrc) {
      return (
        <LazyLoadImage effect="blur" src={imageSrc} alt={`Message Image`} />
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
      if (clickCounter % 5 === 0) {
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
            className={getMessageClasses()} // Dynamically apply classes
            onClick={handleClick}
          >
            <div
              className="sender-name"
              style={{
                display: isCrossCollection || visibility ? "block" : "none",
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
