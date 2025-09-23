"use client";

import { useState, useRef, useEffect, FormEvent } from 'react';

// Define the structure for a single message in the chat
type Message = {
  role: 'user' | 'model';
  content: string;
};

// SVG Icon Components for a cleaner JSX
const UserIcon = () => (
  <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white text-xs">
    U
  </div>
);

const AuraIcon = () => (
  <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-300 text-xs">
    A
  </div>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
);

export default function AuraChatbot() {
  const [inputText, setInputText] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showVideo, setShowVideo] = useState<boolean>(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to the bottom when new messages are added
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Initialize with a welcome message
  useEffect(()=> {
    setMessages([{
        role: 'model',
        content: "Hello! I'm Aura, your empathetic AI companion. Feel free to share what's on your mind. How are you doing today?"
    }]);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputText.trim() || loading || showVideo) return;

    const currentInput = inputText;
    setInputText('');

    if (currentInput.toLowerCase() === 'tapos na ba?') {
        setShowVideo(true);
        // The video is about 6 seconds long. We'll hide it after 7 seconds.
        setTimeout(() => {
            setShowVideo(false);
        }, 7000); 
        return;
    }

    const newMessages: Message[] = [...messages, { role: 'user', content: currentInput }];
    setMessages(newMessages);
    setLoading(true);

    try {
        const response = await fetch('/api/empathic-chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: currentInput }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "An API error occurred.");
        }

        const result = await response.json();
        const botMessage = result.response;

        if (botMessage) {
            setMessages(prev => [...prev, { role: 'model', content: botMessage }]);
        } else {
            setMessages(prev => [...prev, { role: 'model', content: "I'm not sure how to respond to that. Could you try rephrasing?" }]);
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error(errorMessage);
        setMessages(prev => [...prev, { role: 'model', content: `Sorry, something went wrong: ${errorMessage}` }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <main className="bg-gray-900 text-gray-200 h-screen w-full flex flex-col font-sans relative">
      {showVideo && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
              <iframe 
                width="640" 
                height="390" 
                src="https://www.youtube.com/embed/hGNLYgmMq1c?autoplay=1" 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen>
              </iframe>
          </div>
      )}
      <header className="bg-gray-800/60 backdrop-blur-md border-b border-gray-700 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-100">Aura</h1>
      </header>

      <div ref={chatWindowRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start w-full gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && <AuraIcon />}
            <div className={`rounded-xl py-2 px-4 max-w-md break-words text-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-800 border border-gray-700 text-gray-300'
            }`}>
              <p>{msg.content}</p>
            </div>
            {msg.role === 'user' && <UserIcon />}
          </div>
        ))}
         {loading && (
           <div className="flex items-start w-full gap-3 justify-start">
              <AuraIcon />
              <div className="bg-gray-800 border border-gray-700 text-gray-300 rounded-xl py-2 px-4 max-w-md break-words flex items-center">
                  <span className="animate-pulse">...</span>
              </div>
          </div>
         )}
      </div>

      <div className="p-4 bg-gray-900/60 backdrop-blur-md">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-grow pl-4 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-full focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm text-gray-200 placeholder-gray-500"
              placeholder="Type your message..."
              disabled={loading || showVideo}
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim() || showVideo}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-9 w-9 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading ? <div className="spinner-small border-2 border-white/40 border-l-white w-5 h-5 animate-spin rounded-full"></div> : <SendIcon />}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}