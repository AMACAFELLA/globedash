import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { collection, onSnapshot, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const Multiplayer: React.FC = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'multiplayer'), orderBy('timestamp', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && user) {
      await addDoc(collection(db, 'multiplayer'), {
        text: message,
        name: user.displayName,
        timestamp: new Date(),
      });
      setMessage('');
    }
  };

  return (
    <div className="absolute bottom-4 right-4 bg-white p-4 rounded shadow-lg w-64">
      <h3 className="text-lg font-bold mb-2">Multiplayer</h3>
      <div className="h-40 overflow-y-auto mb-2">
        {players.map((player) => (
          <div key={player.id} className="mb-1">
            <strong>{player.name}:</strong> {player.text}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          className="w-full p-2 border rounded"
        />
      </form>
    </div>
  );
};

export default Multiplayer;