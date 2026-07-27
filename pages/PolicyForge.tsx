import React, { useState } from 'react';
import { PolicyList } from '../components/PolicyList';
import { PolicyEditor } from '../components/PolicyEditor';
import { Policy } from '../services/policyService';

export const PolicyForge: React.FC<{ onNotify: (m: string) => void }> = ({ onNotify }) => {
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleSave = () => {
    setShowEditor(false);
    setEditingPolicy(null);
    onNotify('Política salva com sucesso!');
  };

  return (
    <div className="h-full">
      {showEditor ? (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <PolicyEditor
            policy={editingPolicy}
            onSave={handleSave}
            onClose={() => setShowEditor(false)}
          />
        </div>
      ) : (
        <PolicyList
          onSelectPolicy={(policy) => {
            setEditingPolicy(policy);
            setShowEditor(true);
          }}
        />
      )}
    </div>
  );
};
