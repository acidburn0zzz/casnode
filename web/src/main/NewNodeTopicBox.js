// Copyright 2020 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import * as NodeBackend from "../backend/NodeBackend";
import * as TopicBackend from "../backend/TopicBackend";
import * as Setting from "../Setting";
import * as Tools from "./Tools";
import { withRouter, Link } from "react-router-dom";
import "./node-casbin.css";
import "../codemirrorSize.css";
import i18next from "i18next";
import Select2 from "react-select2-wrapper";
import Editor from "./richTextEditor";

import "codemirror/lib/codemirror.css";
import { Controlled as CodeMirror } from "react-codemirror2";
import { Resizable } from "re-resizable";

require("codemirror/mode/markdown/markdown");

const ReactMarkdown = require("react-markdown");

class NewNodeTopicBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      form: {},
      isPreviewEnabled: false,
      isTypingStarted: false,
      nodeId: "",
      nodeInfo: {},
      problems: [],
      message: "",
      width: "",
      editor: [
        {
          text: i18next.t("new:markdown"),
          id: 0,
        },
        {
          text: i18next.t("new:richtext"),
          id: 1,
        },
      ],
      placeholder: i18next.t("new:markdowm"),
    };

    this.renderLargeSize = this.renderLargeSize.bind(this);
    this.renderSmallSize = this.renderSmallSize.bind(this);
    this.publishTopic = this.publishTopic.bind(this);
  }

  componentDidMount() {
    this.getNodeInfo();
    Setting.initOSSClient(this.props.account?.id);
  }

  updateFormField(key, value) {
    let form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
      isTypingStarted: true,
    });
  }

  enablePreview() {
    this.setState({
      isPreviewEnabled: !this.state.isPreviewEnabled,
    });
  }

  isOkToSubmit() {
    if (!this.state.isTypingStarted) {
      return false;
    }

    let problems = [];
    if (this.state.form.title === "" || this.state.form.title === undefined) {
      problems.push(i18next.t("error:Topic title cannot be empty"));
    }

    this.setState({
      problems: problems,
    });

    return problems.length === 0;
  }

  publishTopic() {
    if (!this.isOkToSubmit() || !this.state.nodeInfo) {
      return;
    }
    this.updateFormField("nodeId", this.state.nodeInfo.id);
    this.updateFormField("nodeName", this.state.nodeInfo.name);

    TopicBackend.addTopic(this.state.form).then((res) => {
      if (res.status === "ok") {
        this.props.history.push(`/t/${res?.data}/review`);
      } else {
        this.setState({
          message: res.msg,
        });
      }
    });
  }

  clearMessage() {
    this.setState({
      message: "",
      problems: [],
    });
  }

  renderProblem() {
    let problems = this.state.problems;

    if (this.state.problems.length === 0 && this.state.message === "") {
      return null;
    }

    return (
      <div className="problem" onClick={() => this.clearMessage()}>
        {i18next.t(
          "error:Please resolve the following issues before creating a new topic"
        )}
        <ul>
          {problems.map((problem, i) => {
            return <li>{problem}</li>;
          })}
          {this.state.message !== "" ? (
            <li>{i18next.t(`error:${this.state.message}`)}</li>
          ) : null}
        </ul>
      </div>
    );
  }

  getNodeInfo() {
    NodeBackend.getNode(this.props.nodeId).then((res) => {
      this.setState({
        nodeInfo: res,
      });
    });
  }

  renderPreview() {
    return (
      <div>
        {!this.state.isPreviewEnabled ? null : (
          <div className="dock_area">
            <div className="inner">
              <div className="fr gray" id="syntax_text">
                {i18next.t("new:Already enabled Markdown")} &nbsp;
              </div>
              <span className="gray">Content Preview</span>
            </div>
          </div>
        )}
        <div className="inner" id="topic_preview">
          <div className="topic_content">
            <div className="markdown_body">
              {!this.state.isPreviewEnabled ? null : (
                <ReactMarkdown
                  source={this.state.form.body}
                  escapeHtml={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderHeader() {
    return (
      <div className="header">
        <Link to="/">{Setting.getForumName()}</Link>
        <span className="chevron">&nbsp;›&nbsp;</span>
        <Link to={`/go/${this.props.nodeId}`}>
          {" "}
          {this.state.nodeInfo?.name}{" "}
        </Link>
        <span className="chevron">&nbsp;›&nbsp;</span>{" "}
        {i18next.t("new:New Topic")}
      </div>
    );
  }

  renderSmallSize() {
    return (
      <div className={`box ${this.state.nodeInfo.id}`}>
        {this.renderProblem()}
        <div className={`cell ${this.props.nodeId}`}>
          <textarea
            type="text"
            rows="1"
            maxLength="120"
            name="title"
            className={`sll ${this.state.nodeInfo.id}`}
            id="topic_title"
            onChange={(event) => {
              this.updateFormField("title", event.target.value);
            }}
            placeholder={i18next.t(
              "new:Please input the topic title. The body can be empty if the title expresses the full idea"
            )}
          >
            {this.state.form.title}
          </textarea>
          <div class="sep10"></div>
          {!this.state.form.editorType ||
          this.state.form.editorType === "markdown" ? (
            <div
              style={{
                overflow: "hidden",
                overflowWrap: "break-word",
                resize: "none",
                height: "112px",
              }}
              name="content"
              className={`mll ${this.state.nodeInfo.id}`}
              id="topic_content"
            >
              <Resizable
                enable={false}
                defaultSize={{
                  height: 100,
                }}
              >
                <CodeMirror
                  className={`${this.state.nodeInfo.id}`}
                  editorDidMount={(editor) => Tools.attachEditor(editor)}
                  onPaste={() => Tools.uploadMdFile()}
                  value={this.state.form.body}
                  onDrop={() => Tools.uploadMdFile()}
                  options={{
                    mode: "markdown",
                    lineNumbers: false,
                    lineWrapping: true,
                    theme: `${this.state.nodeInfo.id}`,
                  }}
                  onBeforeChange={(editor, data, value) => {
                    this.updateFormField("body", value);
                  }}
                  onChange={(editor, data, value) => {}}
                />
              </Resizable>
            </div>
          ) : (
            <div
              style={{
                overflow: "hidden",
                overflowWrap: "break-word",
                resize: "none",
                height: "350px",
              }}
              className="mle"
              id="topic_content"
            >
              <Editor
                language={i18next.language}
                height="300px"
                id="richTextEditor"
                onBeforeChange={(value) => {
                  this.updateFormField("body", value);
                }}
              />
            </div>
          )}
          <div class="sep10"></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <input
              type="submit"
              value={i18next.t("node:Publish")}
              class="super normal button"
              onClick={this.publishTopic.bind(this)}
            />
            <div>
              {i18next.t("new:Switch editor")}
              &nbsp;{" "}
              <Select2
                value={this.state.form.editorType}
                style={{ width: "110px", fontSize: "14px" }}
                data={this.state.editor.map((node, i) => {
                  return { text: `${node.text}`, id: i };
                })}
                onSelect={(event) => {
                  const s = event.target.value;
                  if (s === null) {
                    return;
                  }
                  const index = parseInt(s);
                  if (index === 0) {
                    this.updateFormField("editorType", "markdown");
                    this.setState({
                      placeholder: i18next.t("new:markdown"),
                    });
                  } else {
                    this.updateFormField("editorType", "richtext");
                    this.setState({
                      placeholder: i18next.t("new:richtext"),
                    });
                  }
                }}
                options={{ placeholder: this.state.placeholder }}
              />
            </div>
          </div>
        </div>
        <div class="inner">
          <div class="fr">
            <a
              href="/settings/ignore/node/12"
              className={`${this.state.nodeInfo.id}`}
            >
              {i18next.t("node:Ignore this node")}
            </a>
            &nbsp;{" "}
            <span class="fade">
              {i18next.t(
                "node:Topics in the ignored nodes will not appear on the homepage."
              )}
            </span>
          </div>
          &nbsp;
        </div>
      </div>
    );
  }

  renderLargeSize() {
    const title = document.getElementById("topic_title");

    if (title !== null) {
      let contentWidth = title.clientWidth;
      if (this.state.width === "") {
        this.setState({
          width: contentWidth,
        });
      }
    }

    return (
      <div className="box" id="box">
        {this.renderHeader()}
        {this.renderProblem()}
        <div className="cell" id="topic-cell">
          <table cellPadding="5" cellSpacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td>
                  <textarea
                    className="mle"
                    rows="4"
                    name="title"
                    id="topic_title"
                    maxLength="120"
                    onChange={(event) => {
                      this.updateFormField("title", event.target.value);
                    }}
                    autoFocus="autofocus"
                  >
                    {this.state.form.title}
                  </textarea>
                </td>
              </tr>
              <tr>
                <td>
                  {!this.state.form.editorType ||
                  this.state.form.editorType === "markdown" ? (
                    <div
                      style={{
                        overflow: "hidden",
                        overflowWrap: "break-word",
                        resize: "none",
                        height: "172",
                      }}
                      className="mle"
                      id="topic_content"
                    >
                      <Resizable
                        enable={false}
                        defaultSize={{
                          height: 180,
                        }}
                      >
                        <CodeMirror
                          editorDidMount={(editor) =>
                            Tools.attachEditor(editor)
                          }
                          onPaste={() => Tools.uploadMdFile()}
                          value={this.state.form.body}
                          onDrop={() => Tools.uploadMdFile()}
                          options={{
                            mode: "markdown",
                            lineNumbers: false,
                            lineWrapping: true,
                          }}
                          onBeforeChange={(editor, data, value) => {
                            this.updateFormField("body", value);
                          }}
                          onChange={(editor, data, value) => {}}
                        />
                      </Resizable>
                    </div>
                  ) : (
                    <div
                      style={{
                        overflow: "hidden",
                        overflowWrap: "break-word",
                        resize: "none",
                        height: "172",
                      }}
                      className="mle"
                      id="topic_content"
                    >
                      <Editor
                        language={i18next.language}
                        height="300px"
                        id="richTextEditor"
                        onBeforeChange={(value) => {
                          this.updateFormField("body", value);
                        }}
                      />
                    </div>
                  )}
                </td>
              </tr>
              <tr>
                <td
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <input type="hidden" name="once" />
                    <button
                      type="button"
                      className="super normal button"
                      onClick={this.enablePreview.bind(this)}
                    >
                      <li className="fa fa-eye"></li> &nbsp;
                      {i18next.t("newNodeTopic:Preview")}{" "}
                    </button>{" "}
                    &nbsp;
                    <button
                      type="submit"
                      className="super normal button"
                      onClick={this.publishTopic.bind(this)}
                    >
                      <li className="fa fa-paper-plane"></li> &nbsp;
                      {i18next.t("newNodeTopic:Publish")}{" "}
                    </button>{" "}
                  </div>
                  <div>
                    {i18next.t("new:Switch editor")}
                    &nbsp;{" "}
                    <Select2
                      value={this.state.form.editorType}
                      style={{ width: "110px", fontSize: "14px" }}
                      data={this.state.editor.map((node, i) => {
                        return { text: `${node.text}`, id: i };
                      })}
                      onSelect={(event) => {
                        const s = event.target.value;
                        if (s === null) {
                          return;
                        }
                        const index = parseInt(s);
                        if (index === 0) {
                          this.updateFormField("editorType", "markdown");
                          this.setState({
                            placeholder: i18next.t("new:markdown"),
                          });
                        } else {
                          this.updateFormField("editorType", "richtext");
                          this.setState({
                            placeholder: i18next.t("new:richtext"),
                          });
                        }
                      }}
                      options={{ placeholder: this.state.placeholder }}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {this.renderPreview()}
      </div>
    );
  }

  render() {
    if (this.props.size === "small") {
      return this.renderSmallSize();
    } else {
      return this.renderLargeSize();
    }
  }
}

export default withRouter(NewNodeTopicBox);
