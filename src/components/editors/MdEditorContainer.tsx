import React, { useState, useEffect, SyntheticEvent } from "react";
import { TreeNote } from "../../utils/types/notes";
import marked from "marked";
import { base64Encode, base64Decode } from "../../utils/functions";
import { AppCtxt } from "../../Context";
import { ipcRenderer } from "electron";
import { from } from "apollo-boost";
interface LocalProps {
  note: TreeNote;
  onChange: () => any;
}

export default function MdEditorContainer({ note, onChange }: LocalProps) {
  let [editNote, setEditNote] = useState({} as TreeNote);
  const [savedOK, setSavedOK] = useState(false);
  const { preview } = React.useContext(AppCtxt);

  useEffect(() => {
    setEditNote(note);
  }, [note]);

  /*
  useEffect(() => {
    // Save Note
    console.log("Save Note triggered");
    if (editNote.git_url) saveToGithub();
  }, [saveNote]);
  */

  function mdChanged(e: SyntheticEvent<HTMLTextAreaElement>) {
    console.log(e.currentTarget.value);
    setSavedOK(false);
    setEditNote({ ...editNote, content: e.currentTarget.value });
  }

  async function saveToGithub() {
    const encodedContent = base64Encode(editNote.content);
    let data = await fetch(editNote.url, {
      headers: {
        Authorization: `Token ${process.env.REACT_APP_GITHUB_TOKEN}`, // YA Stupid
        // Accept: "application/vnd.github.v3.raw",
      },
      method: "PUT",
      body: JSON.stringify({
        message: "Set file Content",
        sha: editNote.sha,
        content: encodedContent,
      }),
    });
    // TODO SetState from here for Better Flow
    if (!data.ok) {
      let { message } = await data.json();
      console.error(message);
    } else {
      console.log(await data.clone().json());
      let { content } = await data.json();
      setEditNote({
        ...editNote,
        content: base64Decode(encodedContent),
        sha: content.sha,
      });
      setSavedOK(true);
    }
    onChange();
  }
  //
  return (
    <>
      {editNote.url && (
        <div>
          <button
            onClick={saveToGithub}
            className="m-2 px-2 py-1 rounded-lg bg-green-400 text-green-800 text-xl font-light uppercase shadow-md hover:shadow-lg"
          >
            Save
          </button>
          <button
            onClick={async () => {
              await fetch(editNote.url, {
                headers: {
                  Authorization: `Token ${process.env.REACT_APP_GITHUB_TOKEN}`, // YA Stupid
                  Accept: "application/vnd.github.v3.raw",
                },
                method: "DELETE",
                body: JSON.stringify({
                  message: "Delete file",
                  sha: editNote.sha,
                }),
              });
              onChange();
            }}
            className="m-2 px-2 py-1 rounded-lg bg-red-400 text-green-800 text-xl font-light uppercase shadow-md hover:shadow-lg"
          >
            Delete
          </button>
          <button
            onClick={async () => {
              /** @type {ipcRenderer} */
              const ipcRenderer = window.require("electron").ipcRenderer;
              await ipcRenderer.sendSync("printo");
              /*
              const contents = remote.getCurrentWebContents();
              contents.print();
              */
            }}
            className="m-2 px-2 py-1 rounded-lg bg-blue-400 text-green-800 text-xl font-light uppercase shadow-md hover:shadow-lg"
          >
            print
          </button>
        </div>
      )}
      {
        // TODO move to comp with internal state !
        savedOK && (
          <div
            className="flex items-center bg-green-500 text-white text-sm font-bold px-4 py-3"
            role="alert"
          >
            <svg
              className="fill-current w-4 h-4 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M12.432 0c1.34 0 2.01.912 2.01 1.957 0 1.305-1.164 2.512-2.679 2.512-1.269 0-2.009-.75-1.974-1.99C9.789 1.436 10.67 0 12.432 0zM8.309 20c-1.058 0-1.833-.652-1.093-3.524l1.214-5.092c.211-.814.246-1.141 0-1.141-.317 0-1.689.562-2.502 1.117l-.528-.88c2.572-2.186 5.531-3.467 6.801-3.467 1.057 0 1.233 1.273.705 3.23l-1.391 5.352c-.246.945-.141 1.271.106 1.271.317 0 1.357-.392 2.379-1.207l.6.814C12.098 19.02 9.365 20 8.309 20z" />
            </svg>
            <p>Note has been saved.</p>
          </div>
        )
      }

      <div className="h-screen">
        {preview ? (
          <div className="bg-gray-200">
            {editNote.content && (
              <div
                dangerouslySetInnerHTML={{
                  __html: marked(editNote.content, { breaks: true }),
                }}
              ></div>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 m-4 h-full">
            <textarea
              value={editNote.content}
              onChange={mdChanged}
              className="w-full h-full"
            ></textarea>
          </div>
        )}
      </div>

      <div>
        <button
          onClick={saveToGithub}
          className="m-2 px-2 py-1 rounded-lg bg-green-400 text-green-800 text-xl font-light uppercase shadow-md hover:shadow-lg"
        >
          Save
        </button>

        <button
          onClick={() => {
            // TO TOGGLE PREVIEW
          }}
          className="m-2 px-2 py-1 rounded-lg bg-green-400 text-green-800 text-xl font-light uppercase shadow-md hover:shadow-lg"
        >
          Toggle
        </button>
      </div>
    </>
  );
}
