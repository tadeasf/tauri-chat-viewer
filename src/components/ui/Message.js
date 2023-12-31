/**
 * This file is part of Kocouřátčí Messenger.
 *
 * Kocouřátčí Messenger is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kocouřátčí Messenger is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kocouřátčí Messenger. If not, see <https://www.gnu.org/licenses/>.
 *
 * @format
 */

import React, { useState } from "react";
import { DateTime } from "luxon";

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
          className={`message-container flex ${
            author ? "justify-end" : "justify-start ml-5"
          }`}
        >
          <div
            className={`message ${
              author
                ? "message-sent bg-backgroundsent hover:bg-backgroundreceived text-secondary-foreground max-w-[85%]"
                : "message-received bg-backgroundreceived hover:bg-backgroundsent text-accent-foreground max-w-[85%]"
            } ${
              isHighlighted ? "bg-destructive" : ""
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
