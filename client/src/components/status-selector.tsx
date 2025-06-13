interface StatusSelectorProps {
  name: string;
  value?: string;
  onChange: (value: string) => void;
}

export default function StatusSelector({
  name,
  value,
  onChange,
}: StatusSelectorProps) {
  return (
    <div className="flex space-x-4 mt-2">
      <label className="status-conforme flex items-center">
        <input
          type="radio"
          name={name}
          value="conforme"
          checked={value === "conforme"}
          onChange={(e) => onChange(e.target.value)}
          className="text-green-600 focus:ring-green-500"
        />
        <span className="ml-2 text-sm text-green-700">Conforme</span>
      </label>
      <label className="status-nao-conforme flex items-center">
        <input
          type="radio"
          name={name}
          value="nao_conforme"
          checked={value === "nao_conforme"}
          onChange={(e) => onChange(e.target.value)}
          className="text-red-600 focus:ring-red-500"
        />
        <span className="ml-2 text-sm text-red-700">Não Conforme</span>
      </label>
      <label className="status-nao-aplicavel flex items-center">
        <input
          type="radio"
          name={name}
          value="nao_aplicavel"
          checked={value === "nao_aplicavel"}
          onChange={(e) => onChange(e.target.value)}
          className="text-gray-600 focus:ring-gray-500"
        />
        <span className="ml-2 text-sm text-gray-700">N/A</span>
      </label>
    </div>
  );
}
