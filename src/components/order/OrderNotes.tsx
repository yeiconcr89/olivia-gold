import React, { useState } from 'react';
import { MessageSquare, Plus, Clock } from 'lucide-react';

interface OrderNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  isInternal: boolean;
}

interface OrderNotesProps {
  orderId: string;
  notes?: OrderNote[];
  onAddNote?: (orderId: string, note: Omit<OrderNote, 'id' | 'createdAt'>) => Promise<void>;
}

const OrderNotes: React.FC<OrderNotesProps> = ({ orderId, notes = [], onAddNote }) => {
  const [newNote, setNewNote] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !onAddNote || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddNote(orderId, {
        content: newNote.trim(),
        createdBy: 'Admin', // Should come from auth context
        isInternal
      });
      setNewNote('');
      setIsInternal(false);
    } catch (error) {
      console.error('Error adding note:', error);
      // Here you could show an error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-elegant p-6">
      <div className="flex items-center mb-4">
        <MessageSquare className="h-5 w-5 text-elegant-500 mr-2" />
        <h3 className="admin-subheading">Notas</h3>
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="space-y-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Agregar una nota..."
            className="admin-input block w-full"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="form-checkbox text-gold-600 rounded border-elegant-300 focus:ring-gold-500"
              />
              <span className="text-sm text-elegant-600">Nota interna</span>
            </label>
            <button
              type="submit"
              disabled={!newNote.trim() || isSubmitting}
              className={`flex items-center px-3 py-2 rounded-lg text-sm 
                ${newNote.trim() && !isSubmitting
                  ? 'bg-gold-600 text-white hover:bg-gold-700'
                  : 'bg-elegant-100 text-elegant-400 cursor-not-allowed'
                }`}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar nota
            </button>
          </div>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-6 text-elegant-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
            <p>No hay notas para este pedido</p>
          </div>
        ) : (
          notes.map((note) => (
            <div 
              key={note.id} 
              className={`p-4 rounded-lg ${
                note.isInternal 
                  ? 'bg-elegant-50 border border-elegant-200' 
                  : 'bg-gold-50 border border-gold-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <span className="font-medium text-sm">
                    {note.createdBy}
                  </span>
                  {note.isInternal && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-elegant-200 text-elegant-700 rounded-full">
                      Interno
                    </span>
                  )}
                </div>
                <div className="flex items-center text-elegant-500 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(note.createdAt).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const OrderNotesSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-elegant p-6 animate-pulse">
      <div className="h-6 w-32 bg-elegant-200 rounded mb-6" />
      <div className="h-24 w-full bg-elegant-200 rounded mb-4" />
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 bg-elegant-50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-elegant-200 rounded" />
              <div className="h-4 w-32 bg-elegant-200 rounded" />
            </div>
            <div className="h-12 w-full bg-elegant-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export { OrderNotes, OrderNotesSkeleton };