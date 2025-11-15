'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Email } from '../types';   // ✅ correct path

interface SuggestedReplyProps {
  email: Email;
}

export default function SuggestedReply({ email }: SuggestedReplyProps) {
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");

  const generateReply = async () => {
    setLoading(true);
    setReply("");

    try {
      const res = await axios.post("http://localhost:3000/api/reply", {
        subject: email.subject,
        body: email.body,
      });

      setReply(res.data.reply);
    } catch (err) {
      setReply("⚠️ Failed to generate reply.");
    }

    setLoading(false);
  };

  const copyReply = () => {
    navigator.clipboard.writeText(reply);
  };

  return (
    <div className="suggested-reply-section">
      <button className="suggest-reply-button" onClick={generateReply}>
        ✨ Generate Suggested Reply
      </button>

      {loading && (
        <div className="reply-loading">
          <div className="loading-spinner" />
          <p>Generating AI reply...</p>
        </div>
      )}

      {reply && (
        <div className="reply-box">
          <div className="reply-header">
            <span className="reply-icon">💬</span>
            <span className="reply-title">AI Suggested Reply</span>
          </div>

          <div className="reply-content">
            <textarea
              className="reply-textarea"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />

            <div className="reply-actions">
              <button className="copy-button" onClick={copyReply}>
                Copy Reply
              </button>

              <button className="regenerate-button" onClick={generateReply}>
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
