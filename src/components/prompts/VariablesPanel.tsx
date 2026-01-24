import { Zap } from 'lucide-react';

interface VariablesPanelProps {
  variables: string[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export function VariablesPanel({ variables, values, onChange }: VariablesPanelProps) {
  if (variables.length === 0) return null;

  const handleChange = (varName: string, value: string) => {
    onChange({ ...values, [varName]: value });
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Zap className="w-4 h-4 text-yellow-400" /> Variables
      </h3>
      <div className="space-y-2">
        {variables.map((varName) => (
          <div key={varName} className="flex items-center gap-2">
            <span className="text-xs text-purple-400 font-mono bg-purple-900/30 px-2 py-1 rounded">
              {`{{${varName}}}`}
            </span>
            <input
              value={values[varName] || ''}
              onChange={(e) => handleChange(varName, e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-purple-500"
              placeholder={`Valor para ${varName}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
