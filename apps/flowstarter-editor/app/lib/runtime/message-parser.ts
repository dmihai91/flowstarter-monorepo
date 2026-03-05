import type { MessageState, StreamingMessageParserOptions } from './message-parser-types';
import {
  handleActionContent, handleArtifactContent,
  handleTagOpening, handleThinkingContent,
} from './message-parser-handlers';

// Re-export types for backward compatibility
export type {
  ArtifactCallbackData, ActionCallbackData, ThinkingCallbackData,
  ThinkingArtifactCallbackData, ArtifactCallback, ActionCallback,
  ThinkingCallback, ThinkingArtifactCallback, ParserCallbacks,
  StreamingMessageParserOptions,
} from './message-parser-types';

export class StreamingMessageParser {
  #messages = new Map<string, MessageState>();

  constructor(private _options: StreamingMessageParserOptions = {}) {}

  parse(messageId: string, input: string) {
    let state = this.#messages.get(messageId);

    if (!state) {
      state = {
        position: 0,
        insideAction: false,
        insideArtifact: false,
        insideThinking: false,
        insideThinkingArtifact: false,
        currentAction: { content: '' },
        actionId: 0,
      };
      this.#messages.set(messageId, state);
    }

    let output = '';
    let i = state.position;

    while (i < input.length) {
      let result;

      if (state.insideArtifact) {
        result = state.insideAction
          ? handleActionContent(input, state, this._options, messageId, i)
          : handleArtifactContent(input, state, this._options, messageId, i);
      } else if (input[i] === '<' && input[i + 1] !== '/') {
        result = handleTagOpening(input, state, this._options, messageId, i);
      } else if (state.insideThinking) {
        result = handleThinkingContent(input, state, this._options, messageId, i);
      } else {
        output += input[i];
        i++;
        continue;
      }

      output += result.output;
      i = result.position;

      if (result.done || result.earlyBreak) {
        break;
      }
    }

    state.position = i;

    return output;
  }

  reset() {
    this.#messages.clear();
  }
}

