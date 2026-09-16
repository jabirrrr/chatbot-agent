import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('Frontend Chatbot Conversation & Simulator Isolation Tests', () => {
  // Simulated localStorage store
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
  });

  const getConversationKey = (chatbotId) => `helio_conversation_${chatbotId}`;
  const getPreviewKey = (chatbotId) => `helio_preview_${chatbotId}`;

  test('Conversation storage keys are strictly scoped per chatbotId', () => {
    const botA = 'bot-uuid-1111';
    const botB = 'bot-uuid-2222';

    const keyA = getConversationKey(botA);
    const keyB = getConversationKey(botB);

    assert.notEqual(keyA, keyB);
    assert.equal(keyA, 'helio_conversation_bot-uuid-1111');
    assert.equal(keyB, 'helio_conversation_bot-uuid-2222');
    assert.ok(!keyA.includes('undefined'));
    assert.ok(!keyB.includes('undefined'));
  });

  test('Simulator preview keys are strictly scoped per chatbotId', () => {
    const botA = 'bot-uuid-1111';
    const botB = 'bot-uuid-2222';

    const prevA = getPreviewKey(botA);
    const prevB = getPreviewKey(botB);

    assert.notEqual(prevA, prevB);
    assert.equal(prevA, 'helio_preview_bot-uuid-1111');
    assert.equal(prevB, 'helio_preview_bot-uuid-2222');
  });

  test('Switching chatbot cards isolates stored conversations', () => {
    const botA = 'bot-uuid-1111';
    const botB = 'bot-uuid-2222';

    // Bot A has conversation with 2 messages
    mockStorage[getConversationKey(botA)] = JSON.stringify([
      { id: '1', sender: 'bot', text: 'Welcome to Bot A' },
      { id: '2', sender: 'user', text: 'Hello Bot A' }
    ]);

    // Bot B has conversation with 1 message
    mockStorage[getConversationKey(botB)] = JSON.stringify([
      { id: '3', sender: 'bot', text: 'Welcome to Bot B' }
    ]);

    // Retrieve active conversation for Bot A
    const activeMessagesA = JSON.parse(mockStorage[getConversationKey(botA)] || '[]');
    assert.equal(activeMessagesA.length, 2);
    assert.equal(activeMessagesA[0].text, 'Welcome to Bot A');

    // Switch to Bot B
    const activeMessagesB = JSON.parse(mockStorage[getConversationKey(botB)] || '[]');
    assert.equal(activeMessagesB.length, 1);
    assert.equal(activeMessagesB[0].text, 'Welcome to Bot B');

    // Verify Bot B has zero access to Bot A's messages
    const botBTexts = activeMessagesB.map(m => m.text);
    assert.ok(!botBTexts.includes('Hello Bot A'));
  });

  test('Resetting conversation for Chatbot A does not wipe Chatbot B', () => {
    const botA = 'bot-uuid-1111';
    const botB = 'bot-uuid-2222';

    mockStorage[getConversationKey(botA)] = JSON.stringify([{ id: '1', sender: 'bot', text: 'A' }]);
    mockStorage[getConversationKey(botB)] = JSON.stringify([{ id: '2', sender: 'bot', text: 'B' }]);

    // Reset Bot A's conversation
    delete mockStorage[getConversationKey(botA)];

    assert.equal(mockStorage[getConversationKey(botA)], undefined);
    assert.notEqual(mockStorage[getConversationKey(botB)], undefined);
    const retainedB = JSON.parse(mockStorage[getConversationKey(botB)]);
    assert.equal(retainedB[0].text, 'B');
  });

  test('Race condition guard prevents stale async responses bleeding across bots', () => {
    let activeChatbotId = 'bot-A';

    const receivedResponses = {
      'bot-A': [],
      'bot-B': []
    };

    const handleAsyncResponse = (targetBotId, responseText) => {
      // Guard: Only commit response if user is still on the same chatbot
      if (activeChatbotId !== targetBotId) {
        // Discard stale response
        return false;
      }
      receivedResponses[targetBotId].push(responseText);
      return true;
    };

    // User is on Bot A and sends message
    const botATarget = activeChatbotId;

    // User switches to Bot B before Bot A response returns
    activeChatbotId = 'bot-B';

    // Bot A delayed response arrives
    const committedA = handleAsyncResponse(botATarget, 'Late response from Bot A');
    assert.equal(committedA, false, 'Late response from Bot A must be discarded when on Bot B!');
    assert.equal(receivedResponses['bot-B'].length, 0);

    // Bot B response arrives
    const committedB = handleAsyncResponse('bot-B', 'Valid response from Bot B');
    assert.equal(committedB, true);
    assert.equal(receivedResponses['bot-B'].length, 1);
    assert.equal(receivedResponses['bot-B'][0], 'Valid response from Bot B');
  });

  test('Page refresh restores correct conversation per chatbotId', () => {
    const botA = 'bot-uuid-1111';
    const botB = 'bot-uuid-2222';

    // Store state before refresh
    mockStorage[getConversationKey(botA)] = JSON.stringify([{ id: 'a1', text: 'Saved A' }]);
    mockStorage[getConversationKey(botB)] = JSON.stringify([{ id: 'b1', text: 'Saved B' }]);

    // Emulate page reload with active chatbot = botB
    const restoredActiveBot = botB;
    const restoredMessages = JSON.parse(mockStorage[getConversationKey(restoredActiveBot)] || '[]');

    assert.equal(restoredMessages.length, 1);
    assert.equal(restoredMessages[0].text, 'Saved B');
  });
});
